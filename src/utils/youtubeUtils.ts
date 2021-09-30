import { YouTubeSearchOptions, YouTubeSearchResults } from "youtube-search";
var search = require('youtube-search');

const opts: YouTubeSearchOptions = {
    maxResults: 1,
    key: process.env.GOOGLE_KEY
};

export async function getURLfromSearch(pesquisa: string){
    return new Promise((result, error) => {
        search(pesquisa, opts, (err: any, results: YouTubeSearchResults[]) => {
            if(err) error(err);
            else result(results[0].link);
        });
    });
}