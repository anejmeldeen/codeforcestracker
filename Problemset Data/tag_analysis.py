import requests
from collections import Counter

def fetch_problems():
    '''use the codeforces api to return a list of problem objects'''
    url = "https://codeforces.com/api/problemset.problems"
    response = requests.get(url)
    response.raise_for_status() # check for error
    data = response.json()
    if data['status'] != 'OK':
        raise Exception("API Error")
    return data['result']['problems']

def count_tags(problems):
    '''given an array of problem objects, gets the number of occurences of each tag'''
    tag_counter = Counter()
    for problem in problems:
        tags = problem.get('tags', [])
        tag_counter.update(tags)
    return tag_counter

def main():
    '''acquires tag dictionary and stores into "tag_counts.txt" in local directory'''
    problems = fetch_problems()
    tag_counts = count_tags(problems)
    with open("tag_counts.txt", "w") as f:
        for tag, count in tag_counts.most_common():
            f.write(f"{tag}:{count}\n")
    print("Tag counts saved to tag_counts.txt")

if __name__ == "__main__":
    main()