const cachebust = require('./cachebust')
const cutoff = require('./cutoff')
const buildContentNode = require('./buildContentNode')
const icon = require('./icon')
const respImg = require('./respImg')
const sublink = require('./sublink')
const qs = require('query-string')

const buildCollectionFeed = (
  page,
  {
    id,
    content,
    description
  }
) => {
  const append = $(`
    <div class="collection-intro">
      <div class="collection-description">${description}</div>
      <div class="collection-introBottom">
        <label class="collection-searchLabel" for="filter">Search within this collection</label>
        <span class="collection-search">
          ${icon('search', 'type')}
          <input name="filter" type="text" placeholder="Search">
        </span>
      </div>
    </div>
    <p class="content-subheading"></p>
    <ul class="collection">
      ${content.map((item) => buildContentNode(item)).join(' ')}
    </ul>
  `)

  page.append(append)

  const params = { collection: id }
  const $feed = page.find('.collection')
  const $subhead = page.find('.content-subheading')
  page.find('input').keyup(function(e) {
    window.TIMEOUT = setTimeout(() => {
      const term = $(this).val()
      const endpoint = `/wp-json/v1/search/${term}?${qs.stringify(params)}${cachebust(true)}`
      
      $.get(endpoint, ({
        total_hits,
        items,
        results
      }) => {
        if(!items) {
          $subhead.text('No results found')
          $feed.empty()
          return
        }

        $subhead.text(`Showing ${total_hits} hits across ${results} files`)
        $feed.html(items.map(buildContentNode).join(' '))

        // These are created in buildContentNode
        sublink(page.find('[data-sublink]'))
        cutoff(page.find('[data-cutoff]'))
      })
    }, 200)
  }).submit((e) => { e.preventDefault })
}

module.exports = buildCollectionFeed
