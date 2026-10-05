"""Focused static acceptance checks for the authored marketing homepage."""
import json
from pathlib import Path
import unittest
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]

class HomepageAcceptance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.page = BeautifulSoup((ROOT / "index.html").read_text(encoding="utf-8"), "html.parser")

    def test_search_identity(self):
        self.assertEqual(len(self.page.select("h1")), 1)
        self.assertIn("EMPID", self.page.h1.get_text())
        self.assertIn("الموارد البشرية", self.page.title.get_text())
        self.assertEqual(self.page.select_one('link[rel="canonical"]')["href"], "https://empid.com/")
        self.assertFalse(self.page.select("link[hreflang]"))
        self.assertEqual(self.page.select_one('meta[property="og:title"]')["content"], self.page.title.get_text())

    def test_structured_data_does_not_invent_reviews_or_prices(self):
        data = json.loads(self.page.select_one('script[type="application/ld+json"]').string)
        self.assertEqual({entry["@type"] for entry in data["@graph"]}, {"Organization", "WebSite", "WebPage", "SoftwareApplication"})
        for entry in data["@graph"]:
            self.assertNotIn("aggregateRating", entry)
            self.assertNotIn("offers", entry)
            self.assertNotIn("sameAs", entry)

    def test_all_services_are_discoverable(self):
        services = json.loads((ROOT / "docs/service-guides/services.json").read_text(encoding="utf-8"))
        expected = {f'/{service["slug"]}/' for service in services}
        actual = {node["href"] for node in self.page.select(".home-service-link")}
        self.assertEqual(actual, expected)

    def test_links_and_fragment_targets(self):
        for link in self.page.select("a[href]"):
            target = link["href"]
            if target.startswith("#"):
                self.assertIsNotNone(self.page.find(id=target[1:]), target)
            elif target.startswith("/"):
                path = ROOT / target.lstrip("/")
                if path.is_dir():
                    path /= "index.html"
                self.assertTrue(path.is_file(), target)

    def test_form_contract_is_preserved(self):
        form = self.page.select_one("#contact-form")
        self.assertEqual(form["action"], "https://formspree.io/f/xojbopbz")
        self.assertEqual(form["method"].upper(), "POST")
        for field in ["name", "company", "email", "phone", "country", "employees"]:
            self.assertTrue(form.find(id=field).has_attr("required"))
        self.assertEqual(form.find(id="employees")["min"], "1")
        self.assertEqual(form.find(id="email")["type"], "email")
        self.assertIsNotNone(form.select_one('#form-error[role="alert"]'))

    def test_media_is_accessible_and_non_autoplay(self):
        hero = self.page.select_one(".home-product img")
        self.assertEqual(hero["fetchpriority"], "high")
        self.assertTrue(hero["alt"])
        for image in self.page.select("main img"):
            self.assertTrue(image["alt"])
            self.assertTrue(image.has_attr("width") and image.has_attr("height"))
        video = self.page.video
        self.assertTrue(video.has_attr("controls"))
        self.assertFalse(video.has_attr("autoplay"))
        self.assertEqual(video["preload"], "none")
        self.assertIsNotNone(video.select_one('track[kind="captions"]'))

    def test_content_is_bilingual_and_demo_is_labeled(self):
        self.assertTrue(self.page.select(".lang-ar"))
        self.assertTrue(self.page.select(".lang-en[hidden]"))
        self.assertIn("مصطنعة", self.page.get_text())
        self.assertEqual(len(self.page.select("#faq details")), 5)
        self.assertFalse(self.page.select('a[href="https://www.linkedin.com/"]'))

if __name__ == "__main__":
    unittest.main(verbosity=2)
