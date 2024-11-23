import cohere

co = cohere.ClientV2(api_key="roCP9VsNU03ZmHr6YqW2g3kSJznzxJaTF6hxo59b")

response = co.chat(
    model="command-r-plus", 
    messages=[{"role": "user", "content": "hello world!"}]
)

print(response)

