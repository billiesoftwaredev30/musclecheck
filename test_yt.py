from youtubesearchpython import VideosSearch
import json

try:
    search = VideosSearch("Ngiti - The Juans", limit=1)
    print(json.dumps(search.result()))
except Exception as e:
    print("Error:", e)
