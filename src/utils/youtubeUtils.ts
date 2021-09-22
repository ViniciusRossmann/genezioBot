import * as youtubeSearch from "youtube-search";

const opts: youtubeSearch.YouTubeSearchOptions = {
    maxResults: 1,
    key: process.env.GOOGLE_KEY
};

export async function getURLfromSearch(pesquisa: string){
    return new Promise((result, error) => {
        youtubeSearch(pesquisa, opts, (err, results) => {
            if(err) error(err);
            else result(results[0].link);
        });
    });
}