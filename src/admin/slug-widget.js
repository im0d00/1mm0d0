// Decap CMS Custom Automatic Slug Generator Widget for Aimad Security
/* global CMS, createClass, h */

(function () {
  if (typeof CMS === 'undefined' || typeof createClass === 'undefined' || typeof h === 'undefined') {
    console.warn('Decap CMS or hyperscript helper not initialized yet.');
    return;
  }

  // Exact inventory of all 14 existing published articles
  var EXISTING_PUBLISHED_SLUGS = [
    '100-free-security-tools-the-ultimate-verified-guide-for-ethical-hackers-and-forensic-investigators',
    'advanced-malware-evasion-bypassing-edrs-with-direct-syscalls-etw-patching-and-amsi-bypass-—-the-complete-guide',
    'dfir-introduction',
    'educational-keylogger-guide',
    'google-dorking-the-complete-guide-to-advanced-search-operators-finding-hidden-pdfs-and-osint-reconnaissance',
    'home-lab-setup',
    'kali-linux-setup-guide',
    'linux-essentials-guide',
    'metasploitable-complete-guide',
    'nmap-complete-guide',
    'python-backdoor-injection',
    'python-for-security',
    'the-silent-threat-in-your-living-room-analyzing-modem-malware-and-the-chuck-norris-botnet',
    'web-security-for-developers-the-complete-guide-to-building-secure-websites'
  ];

  var allKnownSlugs = new Set(EXISTING_PUBLISHED_SLUGS);

  // Dynamic fetch of search index if running on live server
  if (typeof fetch === 'function') {
    fetch('/search.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (Array.isArray(data)) {
          data.forEach(function (item) {
            if (item.url && item.url.indexOf('/posts/') !== -1) {
              var match = item.url.match(/\/posts\/([^\/]+)/);
              if (match && match[1]) allKnownSlugs.add(match[1]);
            }
          });
        }
      })
      .catch(function () {});
  }

  // Pure Slugify Algorithm satisfying all requirements:
  // - lowercase
  // - remove punctuation & invalid characters
  // - replace spaces with single hyphen
  // - collapse repeated hyphens
  // - trim leading and trailing hyphens
  function slugify(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .replace(/&/g, '')
      .replace(/[''’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Suggest a meaningful alternative suffix
  function suggestAlternative(baseSlug, entry) {
    if (!baseSlug) return '';
    var categories = entry ? entry.getIn(['data', 'categories']) : null;
    var catName = '';
    if (categories) {
      var arr = typeof categories.toJS === 'function' ? categories.toJS() : categories;
      if (Array.isArray(arr) && arr.length > 0) {
        catName = slugify(arr[0]);
      }
    }

    var candidates = [];
    if (catName && catName !== 'cybersecurity' && baseSlug.indexOf(catName) === -1) {
      candidates.push(baseSlug + '-' + catName);
    }
    candidates.push(baseSlug + '-guide');
    candidates.push(baseSlug + '-walkthrough');
    candidates.push(baseSlug + '-deep-dive');
    candidates.push(baseSlug + '-2');

    for (var i = 0; i < candidates.length; i++) {
      if (!allKnownSlugs.has(candidates[i])) {
        return candidates[i];
      }
    }
    return baseSlug + '-part-2';
  }

  var SlugGeneratorControl = createClass({
    getInitialState: function () {
      var initialVal = this.props.value || '';
      var hasInitial = initialVal.trim().length > 0;
      
      // If the entry already has a slug on mount, this is an existing article or saved draft
      return {
        initialSlug: initialVal,
        isExisting: hasInitial,
        isLocked: hasInitial,
        isCustomized: hasInitial,
        lastGeneratedFromTitle: ''
      };
    },

    componentDidMount: function () {
      var title = this.props.entry ? (this.props.entry.getIn(['data', 'title']) || '') : '';
      if (!this.state.isExisting && !this.props.value && title) {
        var autoSlug = slugify(title);
        if (autoSlug) {
          this.setState({ lastGeneratedFromTitle: autoSlug });
          this.props.onChange(autoSlug);
        }
      }
    },

    componentDidUpdate: function (prevProps) {
      // If locked or manually customized, do NOT auto-overwrite
      if (this.state.isLocked || this.state.isCustomized) return;

      var oldTitle = prevProps.entry ? (prevProps.entry.getIn(['data', 'title']) || '') : '';
      var newTitle = this.props.entry ? (this.props.entry.getIn(['data', 'title']) || '') : '';

      if (newTitle !== oldTitle) {
        var generated = slugify(newTitle);
        if (generated !== this.props.value) {
          this.setState({ lastGeneratedFromTitle: generated });
          this.props.onChange(generated);
        }
      }
    },

    handleManualInput: function (e) {
      var raw = e.target.value;
      var cleaned = raw.toLowerCase().replace(/[^a-z0-9\-]/g, '');
      this.setState({ isCustomized: true, isLocked: false });
      this.props.onChange(cleaned);
    },

    handleResyncWithTitle: function (e) {
      if (e && e.preventDefault) e.preventDefault();
      var title = this.props.entry ? (this.props.entry.getIn(['data', 'title']) || '') : '';
      var generated = slugify(title);
      this.setState({ isCustomized: false, isLocked: false, lastGeneratedFromTitle: generated });
      this.props.onChange(generated);
    },

    handleUnlock: function (e) {
      if (e && e.preventDefault) e.preventDefault();
      this.setState({ isLocked: false });
    },

    applySuggestion: function (suggestion, e) {
      if (e && e.preventDefault) e.preventDefault();
      this.setState({ isCustomized: true, isLocked: false });
      this.props.onChange(suggestion);
    },

    isDuplicateCollision: function (slug) {
      if (!slug) return false;
      // If this is an existing article keeping its own initial slug, it's not a collision
      if (this.state.isExisting && slug === this.state.initialSlug) {
        return false;
      }
      return allKnownSlugs.has(slug);
    },

    isValid: function () {
      var slug = (this.props.value || '').trim();
      if (!slug) {
        return { error: { message: 'Article URL slug is required.' } };
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return {
          error: {
            message: 'Slug format invalid: Must use only lowercase letters, numbers, and single hyphens without trailing hyphens.'
          }
        };
      }
      if (this.isDuplicateCollision(slug)) {
        return {
          error: {
            message: 'Duplicate URL Collision: An article already exists at /posts/' + slug + '/. Please choose a unique slug or click the suggested alternative.'
          }
        };
      }
      return true;
    },

    render: function () {
      var currentSlug = this.props.value || '';
      var isDup = this.isDuplicateCollision(currentSlug);
      var alternative = isDup ? suggestAlternative(currentSlug, this.props.entry) : '';
      var isLocked = this.state.isLocked;
      var isCustomized = this.state.isCustomized;

      var publicUrl = 'https://aimadulislam.dpdns.org/posts/' + (currentSlug || '<slug>') + '/';

      return h('div', {
        style: {
          border: '1px solid ' + (isDup ? '#ef4444' : 'rgba(0, 212, 255, 0.25)'),
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          background: 'rgba(10, 22, 40, 0.6)',
          marginTop: '0.5rem',
          marginBottom: '1rem',
          fontFamily: "'Inter', sans-serif"
        }
      },
        // Top Header Row with status badge and action button
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.6rem',
            flexWrap: 'wrap',
            gap: '8px'
          }
        },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            h('span', {
              style: {
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.74rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: isLocked ? 'rgba(100, 116, 139, 0.2)' : (isCustomized ? 'rgba(234, 179, 8, 0.15)' : 'rgba(0, 212, 255, 0.15)'),
                color: isLocked ? '#94a3b8' : (isCustomized ? '#facc15' : '#00d4ff'),
                border: '1px solid ' + (isLocked ? 'rgba(100, 116, 139, 0.3)' : (isCustomized ? 'rgba(234, 179, 8, 0.3)' : 'rgba(0, 212, 255, 0.3)'))
              }
            }, isLocked ? '🔒 Existing URL (Locked to protect links)' : (isCustomized ? '✏️ Custom Slug' : '⚡ Auto-Generated from Title')),
            isDup ? h('span', {
              style: {
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.4)'
              }
            }, '⚠️ DUPLICATE COLLISION') : null
          ),

          // Action button (Unlock or Re-sync)
          isLocked
            ? h('button', {
                type: 'button',
                onClick: this.handleUnlock,
                style: {
                  background: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.4)',
                  color: '#94a3b8',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }
              }, '🔓 Unlock URL to Edit')
            : (isCustomized ? h('button', {
                type: 'button',
                onClick: this.handleResyncWithTitle,
                style: {
                  background: 'transparent',
                  border: '1px solid rgba(0, 212, 255, 0.4)',
                  color: '#00d4ff',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }
              }, '↺ Re-sync with Title') : null)
        ),

        // Slug Text Input
        h('input', {
          id: this.props.forID,
          className: this.props.classNameWrapper,
          type: 'text',
          value: currentSlug,
          disabled: isLocked,
          onChange: this.handleManualInput,
          placeholder: 'e.g. introduction-to-cybersecurity',
          style: {
            width: '100%',
            padding: '0.65rem 0.85rem',
            background: isLocked ? 'rgba(15, 23, 42, 0.6)' : '#070d19',
            border: '1px solid ' + (isDup ? '#ef4444' : (isLocked ? 'rgba(100,116,139,0.3)' : 'rgba(0, 212, 255, 0.35)')),
            borderRadius: '6px',
            color: isLocked ? '#94a3b8' : '#ffffff',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.92rem',
            boxSizing: 'border-box',
            outline: 'none'
          }
        }),

        // Resulting Live URL Preview Bar
        h('div', {
          style: {
            marginTop: '0.6rem',
            padding: '0.5rem 0.75rem',
            background: 'rgba(6, 12, 24, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '6px'
          }
        },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' } },
            h('span', { style: { color: isDup ? '#ef4444' : '#00d4ff', fontWeight: 600 } }, 'Public URL:'),
            h('code', {
              style: {
                color: isDup ? '#ef4444' : '#e2e8f0',
                fontFamily: "'JetBrains Mono', monospace",
                wordBreak: 'break-all'
              }
            }, publicUrl)
          ),
          h('span', {
            style: {
              color: isDup ? '#ef4444' : '#22c55e',
              fontSize: '0.76rem',
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace"
            }
          }, isDup ? '❌ Conflict' : '✓ Ready')
        ),

        // Duplicate Collision Warning & Suggested Alternative Box
        isDup ? h('div', {
          style: {
            marginTop: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '6px',
            fontSize: '0.82rem',
            color: '#fca5a5'
          }
        },
          h('div', { style: { fontWeight: 600, marginBottom: '0.3rem', color: '#f87171' } },
            '⚠️ An article with this URL already exists!'
          ),
          h('div', { style: { marginBottom: '0.5rem', lineHeight: 1.4 } },
            'To prevent overwriting the existing publication or breaking search traffic, every article requires a unique slug.'
          ),
          alternative ? h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
            h('span', null, 'Recommended alternative:'),
            h('button', {
              type: 'button',
              onClick: this.applySuggestion.bind(this, alternative),
              style: {
                background: 'rgba(0, 212, 255, 0.15)',
                border: '1px solid rgba(0, 212, 255, 0.4)',
                color: '#00d4ff',
                fontFamily: "'JetBrains Mono', monospace",
                padding: '3px 10px',
                borderRadius: '4px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 600
              }
            }, '💡 Use: ' + alternative)
          ) : null
        ) : null
      );
    }
  });

  var SlugGeneratorPreview = createClass({
    render: function () {
      return h('div', { style: { fontFamily: "'JetBrains Mono', monospace", color: '#00d4ff' } },
        this.props.value ? 'https://aimadulislam.dpdns.org/posts/' + this.props.value + '/' : ''
      );
    }
  });

  CMS.registerWidget('slug_generator', SlugGeneratorControl, SlugGeneratorPreview);
  console.log('Decap CMS slug_generator widget successfully registered.');
})();
