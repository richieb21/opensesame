from youtube_transcript_api import YouTubeTranscriptApi

def combine_transcript(transcript):
    # Join all text entries, filtering out music/applause markers
    combined_text = ' '.join(
        entry['text'] for entry in transcript 
        if entry['text'] not in ['[Music]', '[Applause]']
    )
    return combined_text

transcript = YouTubeTranscriptApi.get_transcript('W7RUWlwgjQI')
combined = combine_transcript(transcript)
print(combined)