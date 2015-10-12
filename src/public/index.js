
function login(callback) {
    var CLIENT_ID = '972ff492274d4cf7ae53df563ff6aa6f';
    var REDIRECT_URI = 'localhost:3000/callback';
    function getLoginURL(scopes) {
        return 'https://accounts.spotify.com/authorize?client_id=' + CLIENT_ID +
          '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
          '&scope=' + encodeURIComponent(scopes.join(' ')) +
          '&response_type=token';
    }
    
    var url = getLoginURL([
        'user-read-email'
    ]);
          //accounts.spotify.com/authorize?client_id=972ff492274d4cf7ae53df563ff6aa6f&redirect_uri=localhost%3A3000%2Fcallback&scope=user-read-email&response_type=token
    https://accounts.spotify.com/authorize?response_type=code&client_id=972ff492274d4cf7ae53df563ff6aa6f&scope=user-read-private%20user-read-email&redirect_uri=localhost%3A3000%2Fcallback
    var width = 450,https:
        height = 730,
        left = (1000/ 2) - (1000 / 2),
        top = (1000 / 2) - (1000 / 2);

    window.addEventListener("message", function(event) {
        var hash = JSON.parse(event.data);
        if (hash.type == 'access_token') {
            callback(hash.access_token);
        }
    }, false);
    
    var w = window.open(url,
                        'Spotify',
                        'menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left
                       );
    
}

login(token => {
    console.log(token);
})