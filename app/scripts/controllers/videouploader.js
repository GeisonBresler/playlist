'use strict';

/**
 * @ngdoc function
 * @name playlistApp.controller:VideouploaderCtrl
 * @description
 * # VideouploaderCtrl
 * Controller of the playlistApp
 */
app.controller('VideoUploaderCtrl', ['$scope', '$rootScope', 'CurrentVideo', function ($scope, $rootScope, CurrentVideo, $sce) {
  // TODO zerar variável
  $scope.url = "https://www.youtube.com/watch?v=VH8tarypEM4";
  // coloca na playlist
  $scope.send = function(){
    if(!$scope.url){
      // TODO apresenta erro na UI
      return;
    };
    var url = $scope.url;
    //url = helper.Url.removeProtocol(url);
    // var video = new Video(url, callback);
    // dispara loader
    var callback = function(r){
      console.log('on callback', r, video);
      if(video.isValid){
        //video.title = r.items[0].snippet.title;
        video = video;
        videoList = videoList || [];
        videoList.push(video);
        $scope.videoList = videoList;
        // zera valor do input
        $scope.url = "";  
        // verifica se é o único da lista
        if(videoList.length == 1){ 
          CurrentVideo.setVideo(video);
        }
        $scope.$apply();
      }else{
        // apresenta erro de video invalido na UI
        alert('url inválida');
      }
    };
    
    var video = new Video(url, callback);
  };
  //console.log('videoList',  $scope.videoList);

  $scope.$on('Search.AddToVideoList', function(ev, data){
    console.log('on Search.AddToVideoList', data);
    // V1
    // $scope.videoList.push(data.video);
    // $scope.$apply();
    $scope.url = data.url;
    $scope.send();

    // TODO apresentar msg de sucesso na UI
  });

}]);