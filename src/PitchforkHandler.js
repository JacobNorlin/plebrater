"use strict"
require('babel/register');

var Rx = require('rx')
var p4k = require('pitchfork')
var _ = require('lodash')

export default class PitchforkHandler{

	constructor(){

	}

	getAlbumScore(albumName){
		return Rx.Observable.fromEvent(new p4k.Search(albumName), 'ready');
	}

}