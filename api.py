import requests
import time
from typing import Optional, Dict, Any


class URLScanError(Exception):
    """Custom exception for URL scanning errors"""
    pass


def scan_url(url: str, max_retries: int = 12, retry_delay: float = 2.0) -> Optional[Dict[Any, Any]]:
    """
    Scan a URL using VirusTotal API with retry logic

    Args:
        url: The URL to scan
        max_retries: Maximum number of retry attempts
        retry_delay: Delay between retries in seconds
    """
    if not url:
        print("Error: No URL provided")
        return None

    api_key = 'bb6852ded78fe07ff3ba8bbc10db61bc87666fa9077997bbd9059b06d83d22a9'
    headers = {"x-apikey": api_key}

    # Step 1: Submit URL for scanning
    submission_endpoint = "https://www.virustotal.com/api/v3/urls"
    try:
        print(f"\nSubmitting {url} for scanning...")
        response = requests.post(
            url=submission_endpoint,
            data={'url': url},
            headers=headers
        )
        response.raise_for_status()
        scan_id = response.json()['data']['id']
        print("URL submitted successfully.")
    except requests.exceptions.RequestException as e:
        print(f"Error submitting URL: {e}")
        return None

    # Step 2: Get analysis results with retry logic
    analysis_endpoint = f"https://www.virustotal.com/api/v3/analyses/{scan_id}"

    time.sleep(0.5)
    print(f"\nChecking analysis results...")
    time.sleep(0.5)
    print("Analysis still in progress...")
    for attempt in range(max_retries):
        try:

            # Wait before checking results
            time.sleep(retry_delay)

            response = requests.get(url=analysis_endpoint, headers=headers)
            response.raise_for_status()
            result = response.json()

            # Check if analysis is complete
            if result['data']['attributes']['status'] == 'completed':
                print("Analysis completed successfully!")
                return analyze_results(result)





        except requests.exceptions.RequestException as e:
            print(f"Error getting analysis: {e}")
            if attempt == max_retries - 1:
                return None

    print("\nMax retries reached without complete analysis")
    return None


def analyze_results(result: Dict[Any, Any]) -> Dict[Any, Any]:
    """
    Analyze the VirusTotal results and calculate safety score
    """
    stats = result['data']['attributes']['stats']
    results = result['data']['attributes']['results']

    # Ensure we have results before calculating
    count = len(results)
    if count == 0:
        raise URLScanError("No scan results available")

    # Calculate percentages
    percentages = {
        'harmless': round((stats['harmless'] / count) * 100),
        'undetected': (round(stats['undetected'] / count) * 100),
        'suspicious': round((stats['suspicious'] / count) * 100),
        'malicious': round((stats['malicious'] / count) * 100),
        'timeout': round((stats['timeout'] / count) * 100)
    }

    # Calculate safety score
    weights = {
        'harmless': 1,
        'undetected': 0.5,
        'suspicious': -0.8,
        'malicious': -1,
        'timeout': -0.1
    }

    safety_score = round(sum(percentages[key] * weights[key] for key in percentages))

    status_message = ""
    if 80 <= safety_score <= 100:
            status_message = "Very Safe"
    elif 70 <= safety_score < 80:
            status_message = "Safe"
    elif 50 <= safety_score < 70:
            status_message = "Caution"
    elif 20 <= safety_score < 50:
            status_message = "Unsafe"
    else:
            status_message = "Very Unsafe"

    return {
        'status_message': status_message,
        'safety_score': safety_score,
        'percentages': percentages,
        'raw_stats': stats,
        'status': 'completed',
        'total_scanners': count
    }


def check(url):
    results = scan_url(url)

    if results:
        print(f"\nFinal Results for {url}:")
        print(f"Safety Score: {results['safety_score']:.2f}")
        if 80 <= results['safety_score'] <= 100:
            print("Very Safe")
        elif 70 <= results['safety_score'] < 80:
            print("Safe")
        elif 50 <= results['safety_score']< 70:
            print("Caution")
        elif 20 <= results['safety_score'] < 50:
            print("UnSafe")
        else:  # Covers the case where safety_score < 20
            print("Very Unsafe")


        #print(f"Total Scanners: {results['total_scanners']}")
        print("\nPercentages:")
        for category, percentage in results['percentages'].items():
            print(f"{category.capitalize()}: {percentage:.2f}%")
    else:
        print("\nScan failed to complete")



check('youtube.com')
