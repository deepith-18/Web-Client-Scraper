import re
import urllib.parse
from typing import Dict, Any, List, Set, Optional
import httpx
from bs4 import BeautifulSoup
from backend.app.core.config import settings
from backend.app.core.security import is_safe_url
from backend.app.services.verification_service import VerificationService

EMAIL_SCRAPE_REGEX = re.compile(
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b"
)

# Common image/font/script extensions to filter out false positive email matches (e.g. icon@2x.png)
IGNORED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".css", ".js", ".woff", ".woff2", ".ttf"
}

PHONE_SCRAPE_REGEX = re.compile(
    r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}"
)

CONTACT_PATH_KEYWORDS = [
    "contact", "contact-us", "contactus", "reach-us", "reachus",
    "about", "about-us", "aboutus", "get-in-touch", "location"
]

class ExtractedContacts:
    def __init__(self):
        self.emails: Set[str] = set()
        self.phones: Set[str] = set()
        self.contact_page_url: Optional[str] = None
        self.social_links: Dict[str, str] = {}
        self.pages_scanned: List[str] = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "emails": list(self.emails),
            "phones": list(self.phones),
            "contact_page_url": self.contact_page_url,
            "social_links": self.social_links,
            "pages_scanned": self.pages_scanned
        }

class ContactExtractor:
    def __init__(self):
        self.client = httpx.Client(
            timeout=10.0,
            follow_redirects=True,
            headers={"User-Agent": settings.USER_AGENT}
        )

    def close(self):
        self.client.close()

    def extract_from_website(self, base_url: str) -> ExtractedContacts:
        results = ExtractedContacts()
        if not base_url or not is_safe_url(base_url):
            return results

        # 1. Fetch Homepage
        try:
            resp = self.client.get(base_url)
            if resp.status_code != 200:
                return results

            results.pages_scanned.append(base_url)
            soup = BeautifulSoup(resp.text, "html.parser")
            self._parse_page_content(soup, base_url, results)

            # 2. Discover Contact Page Link
            contact_url = self._find_contact_page_url(soup, base_url)
            if contact_url and contact_url != base_url and is_safe_url(contact_url):
                results.contact_page_url = contact_url
                try:
                    c_resp = self.client.get(contact_url)
                    if c_resp.status_code == 200:
                        results.pages_scanned.append(contact_url)
                        c_soup = BeautifulSoup(c_resp.text, "html.parser")
                        self._parse_page_content(c_soup, contact_url, results)
                except Exception:
                    pass

        except Exception:
            pass
        finally:
            self.close()

        return results

    def _parse_page_content(self, soup: BeautifulSoup, page_url: str, results: ExtractedContacts):
        # 1. Look for mailto: links
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if href.lower().startswith("mailto:"):
                raw_mail = href[7:].split("?")[0].strip()
                if self._is_valid_public_email(raw_mail):
                    results.emails.add(raw_mail.lower())
            elif href.lower().startswith("tel:"):
                raw_tel = href[4:].strip()
                if len(re.sub(r"\D", "", raw_tel)) >= 7:
                    results.phones.add(raw_tel)
            else:
                self._check_social_link(href, results)

        # 2. Extract emails from visible text
        page_text = soup.get_text(separator=" ")
        matches = EMAIL_SCRAPE_REGEX.findall(page_text)
        for match in matches:
            clean = match.strip()
            if self._is_valid_public_email(clean):
                results.emails.add(clean.lower())

        # 3. Extract phone candidates
        phone_matches = PHONE_SCRAPE_REGEX.findall(page_text)
        for pm in phone_matches:
            digits = re.sub(r"\D", "", pm)
            if 8 <= len(digits) <= 14:
                results.phones.add(pm.strip())

    def _is_valid_public_email(self, email: str) -> bool:
        if not VerificationService.verify_email_syntax(email):
            return False
        # Filter out static resource artifacts
        for ext in IGNORED_EXTENSIONS:
            if email.lower().endswith(ext):
                return False
        return True

    def _find_contact_page_url(self, soup: BeautifulSoup, base_url: str) -> Optional[str]:
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            text = (a.get_text() or "").lower()
            href_lower = href.lower()

            for kw in CONTACT_PATH_KEYWORDS:
                if kw in href_lower or kw in text:
                    # Resolve relative URL
                    full_url = urllib.parse.urljoin(base_url, href)
                    if is_safe_url(full_url):
                        return full_url
        return None

    def _check_social_link(self, href: str, results: ExtractedContacts):
        h = href.lower()
        if "linkedin.com/company" in h or "linkedin.com/in" in h:
            results.social_links["linkedin"] = href
        elif "facebook.com/" in h and not any(x in h for x in ["sharer", "share"]):
            results.social_links["facebook"] = href
        elif "instagram.com/" in h:
            results.social_links["instagram"] = href
        elif "twitter.com/" in h or "x.com/" in h:
            results.social_links["twitter"] = href
        elif "youtube.com/" in h:
            results.social_links["youtube"] = href

