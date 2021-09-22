import * as youtubeSearch from "youtube-search";

var opts: youtubeSearch.YouTubeSearchOptions = {
  maxResults: 1,
  key: "AIzaSyBFfitDgwjg6PD_DMbT9GvcaVbblehssIU"
};

youtubeSearch("jsconf", opts, (err, results) => {
  if(err) return console.log(err);

  console.dir(results);
});