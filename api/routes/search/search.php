<?php
include_once( get_template_directory().'/models/ContentNode.php' );
$search = new Route( '/search/(?P<term>.*)', 'GET', function( $data ){
  $args = $data->get_query_params();
  $term = str_replace('+', ' ', urldecode($data['term']));
  $results = array_merge(
    $posts_search = get_posts([
      'post_type' => [ 'timeline', 'interview' ],
      'posts_per_page' => -1,
      's' => $term
    ]),
    get_posts([
      'post_type' => [ 'timeline', 'interview' ],
      'posts_per_page' => -1,
      'meta_query' => [
        'relation' => 'OR',
        [
          'key' => 'transcript_raw',
          'value' => $term,
          'compare' => 'LIKE'
        ],
        [
          'key' => 'description_raw',
          'value' => $term,
          'compare' => 'LIKE'
        ],
        [
          'key' => 'supp_cont_raw',
          'value' => $term,
          'compare' => 'LIKE'
        ]
      ],
      // Prevent duplicate terms from previous search
      'exclude' => array_reduce($terms_search, function($excluded_terms , $term) {
        $excluded_terms[] = $term->term_id;
        return $excluded_terms;
      }, [])
    ]),
    $terms_search = get_terms([
      'number' => 0,
      'search' => $term
    ]),
    get_terms([
      'taxonomy' => 'collection',
      'meta_query' => [
        [
          'key' => 'collection_description',
          'value' => $term,
          'compare' => 'LIKE'
        ]
      ],
      // Prevent duplicate terms from previous search
      'exclude' => array_reduce($terms_search, function($excluded_terms , $term) {
        $excluded_terms[] = $term->term_id;
        return $excluded_terms;
      }, [])
    ])
  );

  $count = isset( $args['count'] ) ? $args['count'] : false;
  $offset = isset( $args['offset'] ) ? $args['offset'] : false;

  if( $count !== false && $offset !== false ){
    $results = array_slice( $results, $offset, $count );
  }
  //print_r( $results );

  foreach( $results as $result ){
    if( isset( $result->ID ) ){
      $returns['items'][] = new ContentNode( $result->ID );
    } else {
      $returns['items'][] = new ContentNodeCollection( $result->term_id );
    }
  }

  $returns['name'] = 'Search for '.$data['term'];

  return $returns;
} );
