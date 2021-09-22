import * as youtubeSearch from "youtube-search";
var search = require('youtube-search');

const opts: youtubeSearch.YouTubeSearchOptions = {
    maxResults: 1,
    key: process.env.GOOGLE_KEY
};

export async function getURLfromSearch(pesquisa: string){
    return new Promise((result, error) => {
        search(pesquisa, opts, (err: any, results: any) => {
            if(err) error(err);
            //@ts-ignore
            else result(results[0].link);
        });
    });
}