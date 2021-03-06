const cachebust = require('./cachebust')
const animatePage            = require('./animatePage')
const buildArchive           = require('./buildArchive')
const buildCollectionHeader  = require('./buildCollectionHeader')
const buildCollectionFeed    = require('./buildCollectionFeed')
const buildMenu = require('./buildMenu')
const buildTimeline          = require('./buildTimeline')
const buildTimelineHeader    = require('./buildTimelineHeader')
const buildInterviewsArchive = require('./buildInterviewsArchive')
const buildInterviewsHeader  = require('./buildInterviewsHeader')
const buildOtherInCollection = require('./buildOtherInCollection')
const buildTranscript        = require('./buildTranscript')
const buildSupp              = require('./buildSupp')
const eqHeight               = require('./eqHeight')
const getNodeFromTimestamp   = require('./getNodeFromTimestamp')
const highlighter            = require('./highlighter')
const stickyHeader           = require('./stickyHeader')
const syncAblePlayer         = require('./syncAblePlayer')
const respImg                = require('./respImg')
const Cookies                = require('js-cookie')
const highlightTranscript = require('./highlightTranscript')
const highlightSuppCont = require('./highlightSuppCont')

const buildPage = function(wrapper, endpoint, queriedObject, dir){
  $('[data-action="jumpToActive"], .socialPopup').remove()
  clearInterval(JUMPTOACTIVE) // from syncAblePlayer – stop polling went creating new page
  const page = $('<article class="page"/>')
  $('body').attr('data-endpoint', endpoint)
  $('body').attr('data-id', queriedObject)
  if(queriedObject === 'archive'){
    if(endpoint === 'search'){
      const term = $('body').attr('data-search').replace('+', ' ')
      const type = $('body').attr('data-type') || 'any'
      const params = window.location.search.replace('?', '')
      window.SEARCHTERM = term
      document.title = 'Search for '+term
      const endpoint = `/wp-json/v1/search/${term}/${type}?count=${window.COUNT}&offset=0${cachebust(true)}&${params}`
      $.get(endpoint, function(data){
        if(type === 'interview') {
          buildInterviewArchive(page, data)
        } else {
          buildArchive(page, Object.assign({}, data, { isSearch: true }), endpoint)
        }
        animatePage(wrapper, page, dir, function(){
          respImg.load('.respImg')
        })
      })
    }
    else {
      if(endpoint === 'interviews'){
        const order = Cookies.get('ARCHIVEORDER') || 'abc'
        const url = `/wp-json/v1/interviews?order=${order}&count=-1&include=all`+cachebust(true)

        $.get(url, function(data){
          buildInterviewsArchive(page, data)
          animatePage(wrapper, page, dir, function(){
            respImg.load('.respImg')
          })
        })

      } else {
        const url = '/wp-json/v1/'+endpoint+'?count='+window.COUNT+'&offset=0'+cachebust(true)
        $.get(url, function(data){
          buildArchive(page, data, endpoint, false, false)
          animatePage(wrapper, page, dir, function(){
            respImg.load('.respImg')
          })
        })
      }
    }
  } else {
    const url = `/wp-json/v1/${endpoint}/${queriedObject}`+cachebust()
    $.get(url, function(data){
      if(data.name) document.title = data.name
      DESCRIPTION = data.description
      if(endpoint === 'timelines'){
        buildTimelineHeader(page, data)
        buildTimeline(page, data.events, data.intro, (page) => {
          if(window.location.hash){
            const hash = window.location.hash
            setTimeout(function(){
              $('body, html').scrollTop($(hash).offset().top)
            }, TRANSITIONTIME)
          }
        })
      }
      else if(endpoint === 'interviews'){
        window.INSTRUCTIONS = data.instructions
        if(data.no_media) {
          buildTimelineHeader(page, data, 'interview')
          buildTranscript(page, data.id, (transcript, wrapper) => {
            highlighter('.able-transcript')
            buildSupp(wrapper, endpoint, queriedObject, () => {
              if(data.collections.length) {
                buildOtherInCollection(page, data.id, data.collections[0])
              }
            }, !!transcript)
            if(getNodeFromTimestamp()){
              const timestamp = getNodeFromTimestamp()
              const offset = $('.contentHeaderOuter').outerHeight() + 32
              setTimeout(() => {
                $('body, html').scrollTop(timestamp.offset().top - offset)
              })
            }
          })
        }
        else {
          buildInterviewsHeader(page, data)
          buildTranscript(page, data.id, (transcript, wrapper) => {
            highlighter('.transcript')
            buildSupp(wrapper, endpoint, queriedObject, (supp) => {
              if(data.collections.length){
                buildOtherInCollection(page, data.id, data.collections[0])
              }
              syncAblePlayer(transcript, data.id, supp)
            }, !!transcript)
            stickyHeader(page, '.contentHeaderOuter', '.contentHeader-inner')
          })
        }
      }
      else if(endpoint === 'interactives') {
        window.INSTRUCTIONS = data.instructions
        buildTimelineHeader(page, data, 'interactive')
        if(data.menu) {
          buildMenu(page, window[`menu_${data.menu}`] || [])
        }
        buildTranscript(page, data.id, (transcript, wrapper) => {
          highlighter('.transcript')
          buildSupp(wrapper, endpoint, queriedObject, null, !!transcript)
          if(getNodeFromTimestamp()){
            const timestamp = getNodeFromTimestamp()
            const offset = $('.contentHeader').outerHeight() + 32
            setTimeout(() => {
              $('body, html').scrollTop(timestamp.offset().top - offset)
              timestamp.addClass('able-highlight')
            })
          }
        })
      }
      else if(endpoint === 'collections') {
        buildCollectionHeader(page, data)
        buildCollectionFeed(page, data)
      }

      animatePage(wrapper, page, dir, () => {
        if(endpoint === 'timelines' && $('.respImg').length < 1){
          buildSupp(page, endpoint, queriedObject, () => {
            if(data.collections.length){
              buildOtherInCollection(page, data.id, data.collections[0])
            }
          }, true)
          return
        }

        respImg.load('.respImg', () => {
          // run this as a callback so that height can be based on returned images
          if(endpoint === 'timelines'){
            buildSupp(page, endpoint, queriedObject, () => {
              if(window.SEARCHTERM) {
                highlightTranscript(page.find('.timeline'), '[data-node]', window.SEARCHTERM)
                highlightSuppCont(page.find('.suppCont'), '[data-suppcont]', window.SEARCHTERM)
              }
              if(data.collections.length){
                buildOtherInCollection(page, data.id, data.collections[0])
              }
            }, true)
          }
        })
        eqHeight('.others-single')
      })

    })
  }

}

module.exports = buildPage
