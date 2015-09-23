'use strict';

/**
 * @ngdoc overview
 * @name playlistApp
 * @description
 * # playlistApp
 *
 * Main module of the application.
 */
var app = angular
          .module('playlistApp', [
            'ngScrollbars',
            'wu.masonry',
            'as.sortable',
            'angular-images-loaded'
          ]);
var $injector = angular.injector(['ng']);
var $body = $('body');
var $playlist = $body.find('#playlist');
var $searchModal = $body.find('.search-modal');
// TODO resgatar lista do Storage
var originalVideoList = [];
var videoList = []; //originalVideoList; 
var currentVideo = {};

// Constants
var PLAYER = "player1";
var KEYS = [];
KEYS['youtube'] = 'AIzaSyDdNn7Fj9e0_gIURLfIDm9Cg8ubNzhmmQU%20';
KEYS['vimeo'] = '2f0714bfa2df9de7e74703c0b8c7df1e';

var helper = {};
helper.Date = {};
helper.Date.convertISO8601ToSeconds = function(input){
  var reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
  var hours = 0, minutes = 0, seconds = 0, totalseconds;
  if (reptms.test(input)) {
      var matches = reptms.exec(input);
      if (matches[1]) 
        hours = Number(matches[1]);
      if (matches[2]) 
        minutes = Number(matches[2]);
      if (matches[3])
       seconds = Number(matches[3]);
      
      totalseconds = hours * 3600  + minutes * 60 + seconds;
  }
  return (totalseconds);
};
helper.Date.formatDecimal = function(n){
  if((n+'').length == 1){
    return '0'+n;
  }
  return (n+'').substr(0, 2);
};
helper.Date.secondsToStringFormatted = function(time){
  var minutes = Math.floor(time / 60);
  var seconds = time - minutes * 60;
  if(minutes > 60){
    var hours = Math.floor(time / 3600);
    seconds = time - hours * 3600;
    minutes = Math.floor(seconds / 60);
    seconds = time - minutes * 60;
    return helper.Date.formatDecimal(hours)+':'+helper.Date.formatDecimal(minutes)+':'+helper.Date.formatDecimal(seconds);
  }else{
    return helper.Date.formatDecimal(minutes)+':'+helper.Date.formatDecimal(seconds);
    //return '00:'+helper.Date.formatDecimal(minutes)+':'+helper.Date.formatDecimal(seconds);
  }
};
helper.Url = {};
helper.Url.removeProtocol = function(url){
  if(!!~url.indexOf('https://'))
      return url.replace('https://', '');
  if(!!~url.indexOf('http://'))
      return url.replace('http://', '');
  if(url.substring(0, 2) === '//')
    return url.replace('//','');
  return url;
};
helper.Url.isYoutube = function(url){
  return  !!~url.indexOf("youtu.be") || !!~url.indexOf("youtube");
};
helper.Url.isVimeo = function(url){
  return  (!!~url.indexOf("vimeo"));
};
helper.Url.getOrigin = function(url){
  if(helper.Url.isYoutube(url))
    return 'youtube';
    else if(helper.Url.isVimeo(url))
      return 'vimeo';
    return '';
};
helper.Url.getID = function(url){
  // url = helper.Url.removeProtocol(url);
  // // split querystring
  // url = url.split('?')[0];
  // split / 

  var link = document.createElement('a');
  link.href = url;
  var path = link.pathname;
  if(path.substring(0, 1) === '/'){
    path = path.replace('/','');
  }
  return path.split('/')[0];
};
helper.Url.getParameterByName = function(url, name){
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(url);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

var Player = {};
Player.Youtube = {};
Player.Youtube.call = function(frame_id, func, args){
  if (window.jQuery && frame_id instanceof jQuery) frame_id = frame_id.get(0).id;
  var iframe = document.getElementById(frame_id);
  if (iframe && iframe.tagName.toUpperCase() != 'IFRAME') {
      iframe = iframe.getElementsByTagName('iframe')[0];
  }
  if (iframe) {
      // Frame exists, 
      iframe.contentWindow.postMessage(JSON.stringify({
          "event": "command",
          "func": func,
          "args": args || [],
          "id": frame_id
      }), "*");
  }
};
Player.Youtube.instance = null;
Player.Youtube.newInstance = function(id){
  return new YT.Player(PLAYER, {
          videoId: id,
          events: {
            'onStateChange': Player.Youtube.OnPlayerStateChange
          }
        });
};
Player.Youtube.OnPlayerStateChange = function(e){
  console.log('youtube play onPlayerStateChange', e);
  // stop/finish
  if(e.data === 0){
    $body.trigger('PlayerStatePause');
    // mudar para próximo vídeo
    $body.trigger('PlayerStateChangeNext');
  }
  // play
  if(e.data === 1){    
    $body.trigger('PlayerStatePlay');
  }
  // pause
  if(e.data === 3 || e.data === 2 || e.data === -1){
    // console.log('Player.Youtube.OnPlayerStateChange pause data 2');
    // $injector.invoke(function($rootScope) {
    //   console.log('Player.Youtube.OnPlayerStateChange data 2 invoke', $rootScope);
    //   $rootScope.$broadcast('Player.Pause', {});
    // });
    
    $body.trigger('PlayerStatePause');
  }
  
};
Player.Vimeo = {};

app.config(function (ScrollBarsProvider) {
  // scrollbar defaults
  ScrollBarsProvider.defaults = {
    autoHideScrollbar: false,
    setHeight: 352, //100
    scrollInertia: 0,
    axis: 'y',
    advanced: {
      updateOnContentResize: true
      //,releaseDraggableSelectors: "#playlist li img" 
    },
    scrollButtons: {
      scrollAmount: 'auto', // scroll amount when button pressed
      enable: false // enable scrolling buttons by default
    }
  };
});

$(window).load(function(){
  //$('.modal-btn').modal();
  $searchModal = $body.find('.search-modal');
  var $playlist = $('#playlist');
  var $player = $('#'+PLAYER);
  var availHeight = screen.availHeight;
  var adjustPlayerHeight = function(){
    var h = availHeight - $('#header').height() - 100;
    $player.height(h);
  };
  var adjustPlaylistHeight = function(){
    //console.debug('adjustPlaylistHeight availHeight',availHeight, 'videoUploader videoCtrl', $('#videoUploader').height() , $('#videoCtrl').height() )
    var h = availHeight - $('#videoUploader').height() - 110 - $('#videoCtrl').height() - 110 /*100*/ ;
    $playlist.height(h);
    //$('#VideoList').height(h);
  };
  var onResize = function(){
    adjustPlayerHeight();
    adjustPlaylistHeight();
  };
  //adjustIframeHeight();
  onResize();
  $(window).on('resize', onResize);

  //$('[data-toggle="tooltip"]').tooltip();
});
