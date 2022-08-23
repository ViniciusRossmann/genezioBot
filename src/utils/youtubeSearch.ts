import search, { YouTubeSearchOptions } from "youtube-search";
require('dotenv/config');

const opts: YouTubeSearchOptions = {
    maxResults: 1,
    key: process.env.GOOGLE_KEY
};

interface QueryResult {
    link: string;
    title: string;
}

export async function getURLfromSearch(pesquisa: string): Promise<QueryResult|null>{
    return new Promise((resolve) => {
        search(pesquisa, opts, (err: any, results: any) => {
            if(err) resolve(null);
            if (results.length == 0) resolve(null);
            resolve(results[0]);
        });
    });
}