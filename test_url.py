from youtubesearchpython import VideosSearch
import json

try:
    search = VideosSearch("https://www.youtube.com/watch?v=jD3P4RaXVnE", limit=1)
    result = search.result()
    print(json.dumps(result))
except Exception as e:
    print("Error:", e)
