// Decap CMS Custom Preview Templates for Aimad Security
/* global CMS, createClass, h */

(function () {
  if (typeof CMS === 'undefined' || typeof createClass === 'undefined' || typeof h === 'undefined') {
    console.warn('Decap CMS or hyperscript helper not initialized yet.');
    return;
  }

  // 1. Register Public Site Styles into Preview Frame
  CMS.registerPreviewStyle('/css/main.css');
  CMS.registerPreviewStyle('/css/blog.css');
  CMS.registerPreviewStyle('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
  CMS.registerPreviewStyle('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');

  // Preview Base Wrapper Styling
  var previewWrapperStyle = {
    background: '#030712',
    color: '#e2e8f0',
    minHeight: '100vh',
    padding: '2rem 1.5rem',
    fontFamily: "'Inter', sans-serif"
  };

  var containerStyle = {
    maxWidth: '920px',
    margin: '0 auto'
  };

  // 2. Blog Post Preview Template
  var PostPreview = createClass({
    render: function () {
      var entry = this.props.entry;
      var title = entry.getIn(['data', 'title']) || 'Untitled Article';
      var excerpt = entry.getIn(['data', 'excerpt']) || '';
      var author = entry.getIn(['data', 'author']) || 'Aimad Ul Islam';
      var date = entry.getIn(['data', 'date']);
      var dateFormatted = date
        ? new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

      var image = this.props.getAsset(entry.getIn(['data', 'image'])) || this.props.getAsset(entry.getIn(['data', 'featured_image']));
      var imageAlt = entry.getIn(['data', 'imageAlt']) || title;
      var categories = entry.getIn(['data', 'categories']);
      var catList = categories
        ? (typeof categories.toJS === 'function' ? categories.toJS() : [categories])
        : ['Cybersecurity'];
      var category = (Array.isArray(catList) && catList.length > 0) ? catList[0] : 'Cybersecurity';
      var difficulty = entry.getIn(['data', 'difficulty']) || 'Intermediate';
      var status = entry.getIn(['data', 'status']) || 'Published';
      var isDraft = entry.getIn(['data', 'draft']) === true || status.toLowerCase() === 'draft';

      return h('div', { style: previewWrapperStyle },
        h('div', { style: containerStyle },
          // Draft Status Banner (Preview Only)
          isDraft ? h('div', {
            style: {
              background: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              color: '#facc15',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }
          }, '🔒 Draft Preview Mode — This article will NOT be visible on public blog listings until published.') : null,

          // Breadcrumbs
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.82rem',
              color: '#64748b',
              marginBottom: '1.25rem'
            }
          },
            h('span', null, 'Home'),
            h('span', null, '›'),
            h('span', null, 'Blog'),
            h('span', null, '›'),
            h('span', { style: { color: '#00d4ff' } }, title)
          ),

          // Cover Image
          image ? h('div', {
            style: {
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(0, 212, 255, 0.25)',
              marginBottom: '2rem',
              background: 'rgba(6, 12, 24, 0.8)'
            }
          },
            h('img', {
              src: image.toString(),
              alt: imageAlt,
              style: {
                width: '100%',
                maxHeight: '440px',
                objectFit: 'cover',
                display: 'block'
              }
            })
          ) : null,

          // Article Header Card
          h('header', {
            style: {
              background: 'rgba(10, 22, 40, 0.75)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem',
              position: 'relative'
            }
          },
            h('div', {
              style: {
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap'
              }
            },
              h('span', {
                style: {
                  background: 'rgba(0, 212, 255, 0.1)',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  color: '#00d4ff',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace"
                }
              }, category),
              h('span', {
                style: {
                  background: 'rgba(124, 58, 237, 0.15)',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  color: '#a78bfa',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontFamily: "'JetBrains Mono', monospace"
                }
              }, difficulty)
            ),
            h('h1', {
              style: {
                fontSize: '2rem',
                fontWeight: 700,
                color: '#ffffff',
                fontFamily: "'Space Grotesk', sans-serif",
                lineHeight: 1.25,
                margin: '0 0 1rem 0'
              }
            }, title),
            excerpt ? h('p', {
              style: {
                fontSize: '1.05rem',
                color: '#94a3b8',
                lineHeight: 1.6,
                margin: '0 0 1.5rem 0'
              }
            }, excerpt) : null,
            h('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.85rem',
                color: '#64748b'
              }
            },
              h('span', { style: { color: '#e2e8f0', fontWeight: 600 } }, author),
              h('span', null, '•'),
              h('span', null, dateFormatted)
            )
          ),

          // Article Markdown Body
          h('div', {
            className: 'article-body',
            style: {
              background: 'rgba(10, 22, 40, 0.55)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '2.5rem 2rem',
              lineHeight: 1.75,
              fontSize: '1rem',
              color: '#e2e8f0'
            }
          },
            this.props.widgetFor('body')
          ),

          // Return to Blog Navigation
          h('div', {
            style: {
              marginTop: '3rem',
              textAlign: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '2rem'
            }
          },
            h('a', {
              href: '/blog/',
              style: {
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                background: 'rgba(0, 212, 255, 0.08)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: '#00d4ff',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.88rem',
                fontWeight: 600
              }
            }, '← Return to All Writeups')
          )
        )
      );
    }
  });

  // 3. Register Post Preview Template
  CMS.registerPreviewTemplate('posts', PostPreview);
  console.log('Decap CMS Preview Template registered for: posts');
})();
