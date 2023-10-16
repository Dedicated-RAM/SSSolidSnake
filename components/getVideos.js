import axios from "axios";

async function getUploadsPlaylistId(channelId, apiKey) {
	const response = await axios.get(
		`https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&id=${channelId}&part=contentDetails`
	);
	return response.data.items[0].contentDetails.relatedPlaylists.uploads;
}

async function getPlaylistVideos(playlistId, apiKey, pageToken = "") {
	try {
		let allVideos = [];
		let nextPageToken = pageToken;

		do {
			const response = await axios.get(
				`https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${playlistId}&part=snippet&maxResults=50&pageToken=${nextPageToken}`
			);
			const videoIds = response.data.items
				.map((item) => item.snippet.resourceId.videoId)
				.join(",");

			if (videoIds) {
				const videoDetailsResponse = await axios.get(
					`https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds}&part=snippet,contentDetails`
				);
				allVideos = allVideos.concat(videoDetailsResponse.data.items);
			}

			nextPageToken = response.data.nextPageToken;
		} while (nextPageToken);

		return allVideos;
	} catch (error) {
		console.error(error);
	}
}

// write function to return all videos from a channel
export async function getVideos(channelId, apiKey) {
	const playlistId = await getUploadsPlaylistId(channelId, apiKey);
	const videos = await getPlaylistVideos(playlistId, apiKey);
	return videos;
};
