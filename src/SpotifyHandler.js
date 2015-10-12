"use strict"
require('babel/register');

var Rx = require('rx')
var request = require('request')
var _ = require('lodash')
var EventEmitter = require('events').EventEmitter

export default class SpotifyHandler{



	constructor(accessToken, refreshToken){
		this.postObservable = Rx.Observable.fromNodeCallback(request.post, undefined, (incomingMessage, token) => {return token});
		
	    this.getObservable = Rx.Observable.fromNodeCallback(request.get, undefined, (incomingMessage, token) => {return token})


	    this.accessToken = accessToken;
	    this.refreshToken = refreshToken;
	    this.eventEmitter = new EventEmitter();

	    let requestQueue = Rx.Observable.fromEvent(this.eventEmitter, 'apiRequest', (apiUrl, id) => {
	    	let options = {
				 url: apiUrl,
				 headers: { 'Authorization': 'Bearer ' + this.accessToken },
				 json: true
				};
			return {obs: this.getObservable(options), id: id};
	    })

    

	    this.someId = 0;

	}


	authenticatedGet(apiUrl){
		let options = {
				 url: apiUrl,
				 headers: { 'Authorization': 'Bearer ' + this.accessToken },
				 json: true
				};
		return this.getObservable(options)
	}

	userDataObs(){
		return this.authenticatedGet('https://api.spotify.com/v1/me')
	}
	/**
	 * @param  {string} Spotify api end point url
	 * @param  {int} Max amount of objects returned by api
	 * @return {Observable{Object}} Returns a sequence of the objectts the api returned. So a single request that contains 20 playlists is returned as an observable containing 20 playlist objects
	 */
	multiRequest(apiUrl, limit){
		return this.authenticatedGet(apiUrl+'/?limit='+limit)
			.flatMap(data => {
				let nRequests = (data.total % limit)
				let head = Rx.Observable.from(data.items)
				if(data.next != null){
					let tail = this.tailRequest(apiUrl, nRequests, limit)
					return Rx.Observable.merge(head, tail);
				}else{
					return head
				}
			})
	}


	tailRequest(apiUrl, nRequests, limit){
		return Rx.Observable.range(1, nRequests)
			.map((_, x) => {
				return this.authenticatedGet(apiUrl+'/?offset='+x*limit)
					.flatMap(data => {
						return Rx.Observable.from(data.items)
					})
			})
			.mergeAll()
	}

	playlistsObs(userId){
		return this.multiRequest('https://api.spotify.com/v1/users/'+userId+'/playlists', 50)
	}

	tracksOfPlaylist(playlist){
		return this.multiRequest(playlist.tracks.href, 100)	
	}

	albumsInPlaylist(playlist){
		let tracks = this.tracksOfPlaylist(playlist)
		return tracks.map(trackObject => {
			return trackObject.track.album.name;
		}).distinct()
	}

	tracksOfAllPlaylistsObs(userId){
		let playlists = this.playlistsObs(userId)

		return playlists.flatMap(playlist => {
			return this.tracksOfPlaylist(playlist)
		});
	}

	tracksOfAllPlaylistsForCurrentUserObs(){
		return this.userDataObs()
			.flatMap(data => {
				return this.tracksOfAllPlaylistsObs(data.user)
			})
	}



}