from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright
from auto_email import send_mail_to_agency

app = Flask(__name__)
CORS(app)

def classify_text(text, candidate_labels):
    classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli",multi_label=False)
    result = classifier(text, candidate_labels)
    return result

def fetch_with_requests(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    response = requests.get(url, headers=headers)
    #response = requests.get(url, headers=headers, verify=False)
    return response

def fetch_with_playwright(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)  
        page = browser.new_page()
        page.goto(url, timeout=60000) 
        content = page.content()  
        browser.close()
        return content
    
def extract_pgtitle_and_relevtext(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    pg_title=soup.title.string
    relevant_text = ""
    for element in soup.find_all(['article', 'main', 'section', 'p']):
        relevant_text += element.get_text(separator='\n', strip=True) + '\n'

    return pg_title, relevant_text

def approve_reject_agency(base_url):
    possible_about_pg_keywords = ['about', 'about-us', 'aboutus', 'who-we-are', 'about_me']
    possible_services_pg_keywords = ['services','our-services','services-page','what-we-offer','offerings','solutions','service-overview','features','capabilities']

    webpage_classes_positive = ["Website design and development", "Search engine optimization", "Advertising agency", 
                              "Digital marketing agency"]
    webpage_classes_negative = ["Agriculture plants", "Automotive","Fertilizer Chemical industry", "Civil building road","Retail sales", "Healthcare hospitals",
                              "Financial Banking Insurance", "Transportation goods movement", "Education coaching","Information Technology",
                              "Software products", "Travel tourism", "Hotels", "Forestry", "Communication Telecommunication", "Broadcasting", "Governmental"]
    webpage_classes = webpage_classes_positive + webpage_classes_negative

    acc_rej_err=""
    acc_rej_err_reason=""
    additional_info=""
    try:
        relevant_text = ""

        homepage_response = fetch_with_requests(base_url)
        if homepage_response.status_code == 200:
            page_title, page_text = extract_pgtitle_and_relevtext(homepage_response.text)   # for home page
            relevant_text+=page_text
            additional_info+=("Checked "+page_title+". ")
            soup = BeautifulSoup(homepage_response.text, 'html.parser')

            links = soup.find_all('a', href=True)
            found_about_page = None
            found_services_page = None

            for link in links:
                href = link['href']
                if any(keyword in href.lower() for keyword in possible_about_pg_keywords):
                    found_about_page = urljoin(base_url, href)  # Build the absolute URL
                    #print(f"Potential 'About Us' page found: {found_about_page}")
                    break
              
            for link in links:
                href = link['href']
                if any(keyword in href.lower() for keyword in possible_services_pg_keywords):
                    found_services_page = urljoin(base_url, href) 
                    #print(f"Potential 'Services' page found: {found_services_page}")
                    break

            if found_about_page:
                response = fetch_with_requests(found_about_page)
                if response.status_code == 200:
                    page_title, page_text = extract_pgtitle_and_relevtext(response.text)
                    relevant_text+=page_text

                elif response.status_code == 403:
                    page_content = fetch_with_playwright(found_about_page)
                    page_title, page_text = extract_pgtitle_and_relevtext(page_content)
                    relevant_text+=page_text
                else:
                    additional_info+=(f"Failed to fetch the About page. Status code: {response.status_code}")

            else:
                additional_info+="No 'About Us' page found on the homepage. "

            if found_services_page:
                response = fetch_with_requests(found_services_page)
                if response.status_code == 200:
                    page_title, page_text = extract_pgtitle_and_relevtext(response.text)
                    relevant_text+=page_text

                elif response.status_code == 403:
                    additional_info+=("403 Forbidden encountered. Attempting to fetch with Playwright... "+page_title+". ")
                    page_content = fetch_with_playwright(found_services_page)
                    print("Successfully fetched the page with Playwright. Extracting visible text...")
                    page_title, page_text = extract_pgtitle_and_relevtext(page_content)
                    relevant_text+=page_text
                else:
                    additional_info+=(f"Failed to fetch the Services page. Status code: {response.status_code}")

            else:
                additional_info+="No 'Services' page found on the homepage. "

        else:
            additional_info+=(f"Failed to fetch the homepage. Status code: {response.status_code}")

    except Exception as e:
        additional_info+=(f"An error occurred: {e}")

    if (relevant_text!=''):
        page_classes = classify_text(relevant_text, webpage_classes)  
        labels = page_classes['labels']
        probabilities = page_classes['scores']
        print("Predicted labels and scored:", labels,probabilities)
        acc_prob=0
        classes_positive=""
        for i in range(3):  
            if labels[i] in webpage_classes_positive:
                acc_prob+=probabilities[i]
                if(classes_positive!=""):
                    classes_positive+="| "
                classes_positive+=labels[i]

            if(acc_prob>0):  
                acc_rej_err="ACCEPTED"
                acc_rej_err_reason="Website indicates that the agency's areas include: "+classes_positive+". "
            else:
                acc_rej_err="REJECTED"
                acc_rej_err_reason="Website does not indicate that the agency is into any of the relevant areas. "

    else:
        acc_rej_err="ERROR"
        acc_rej_err_reason="Failed to extract data from relevant pages of the website. "

    return acc_rej_err, acc_rej_err_reason, additional_info

@app.route('/eligibility-check', methods=['POST'])
def eligibility_check():
    data = request.get_json()
    base_url = data.get('website')
    acc_rej_err, acc_rej_err_reason, additional_info = approve_reject_agency(base_url)
    return jsonify({'status': acc_rej_err,
                    'reason': acc_rej_err_reason,
                    'additional_info': additional_info
                  })

@app.route('/send-email', methods=['POST'])
def send_email():
    data = request.get_json()
    contact_name = data.get('contact_name')
    recipient_email = data.get('email')
    status = data.get('status')

    send_mail_to_agency(
        agency_name=contact_name,
        agency_email=recipient_email, 
        is_accepted=status
    )
    return jsonify({'message': 'Email sent successfully'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
