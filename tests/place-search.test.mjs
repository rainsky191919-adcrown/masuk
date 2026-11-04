import test from 'node:test'
import assert from 'node:assert/strict'
import {placeSearchKey,matchesPlaceQuery,suggestPlaces} from '../src/lib/placeSearch.js'
const locations=[{id:'1',name:'Bukit Impian Residence',area:'Skudai, Johor',address:'Jalan Impian Emas 2'},{id:'2',name:'D’Secret Garden',area:'Skudai',address:'Jalan Foo'}]
test('name formatting does not hide an existing location',()=>{
 for(const query of ['Bukit Impian','BukitImpian',' BUKIT-IMPIAN ','Ｂｕｋｉｔ　Ｉｍｐｉａｎ','bukit.impian']) assert.equal(matchesPlaceQuery(locations[0],query),true)
 assert.equal(matchesPlaceQuery(locations[1],"D'Secret"),true)
 assert.equal(matchesPlaceQuery(locations[0],'JalanImpianEmas2'),true)
 assert.equal(placeSearchKey('Café'),placeSearchKey('CAFE'))
})
test('suggestions are bounded existing names, never invented matches',()=>{
 assert.equal(matchesPlaceQuery(locations[0],'Bukt Impian'),false)
 assert.equal(suggestPlaces(locations,'Bukt Impian')[0],locations[0])
 assert.deepEqual(suggestPlaces(locations,'zzznomatchmobile'),[])
 assert.deepEqual(suggestPlaces(locations,'ab'),[])
 assert.deepEqual(suggestPlaces(locations,'x'.repeat(101)),[])
})
