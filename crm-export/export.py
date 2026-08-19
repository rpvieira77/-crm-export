#!/usr/bin/env python3
import os
import csv
import json
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright
import logging

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CRMExporter:
    def __init__(self):
        self.crm_url = os.getenv('CRM_URL')
        self.crm_username = os.getenv('CRM_USERNAME')
        self.crm_password = os.getenv('CRM_PASSWORD')
        self.output_dir = os.getenv('OUTPUT_DIR', './exports')
        self.headless = os.getenv('HEADLESS', 'true').lower() == 'true'

        if not all([self.crm_url, self.crm_username, self.crm_password]):
            raise ValueError("Missing required environment variables: CRM_URL, CRM_USERNAME, CRM_PASSWORD")

        Path(self.output_dir).mkdir(parents=True, exist_ok=True)

    def export_leads(self):
        """Export leads from CRM using Playwright automation."""
        logger.info(f"Starting CRM export from {self.crm_url}")

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=self.headless)
            page = browser.new_page()

            try:
                # Navigate to CRM
                page.goto(self.crm_url, wait_until='networkidle')
                logger.info("Opened CRM URL")

                # Login
                self._login(page)

                # Navigate to leads section
                self._navigate_to_leads(page)

                # Extract leads data
                leads = self._extract_leads(page)

                # Save to CSV
                output_file = self._save_to_csv(leads)
                logger.info(f"Successfully exported {len(leads)} leads to {output_file}")

                return output_file, leads

            except Exception as e:
                logger.error(f"Error during export: {str(e)}")
                raise
            finally:
                browser.close()

    def _login(self, page):
        """Login to CRM."""
        try:
            # Wait for login form and fill credentials
            page.fill('[name="username"]', self.crm_username)
            page.fill('[name="password"]', self.crm_password)
            page.click('button[type="submit"]')
            page.wait_for_navigation(wait_until='networkidle')
            logger.info("Logged in successfully")
        except Exception as e:
            logger.error(f"Login failed: {str(e)}")
            raise

    def _navigate_to_leads(self, page):
        """Navigate to leads section in CRM."""
        try:
            # Click on leads menu item
            page.click('a:has-text("Leads")')
            page.wait_for_load_state('networkidle')
            logger.info("Navigated to Leads section")
        except Exception as e:
            logger.error(f"Failed to navigate to leads: {str(e)}")
            raise

    def _extract_leads(self, page):
        """Extract leads data from the page."""
        leads = []
        try:
            # Get all rows from the leads table
            rows = page.query_selector_all('table tbody tr')

            for row in rows:
                cells = row.query_selector_all('td')
                if len(cells) >= 4:
                    lead = {
                        'id': cells[0].text_content().strip(),
                        'name': cells[1].text_content().strip(),
                        'phone': cells[2].text_content().strip(),
                        'status': cells[3].text_content().strip(),
                        'created_at': cells[4].text_content().strip() if len(cells) > 4 else '',
                    }
                    leads.append(lead)

            logger.info(f"Extracted {len(leads)} leads")
            return leads
        except Exception as e:
            logger.error(f"Failed to extract leads: {str(e)}")
            raise

    def _save_to_csv(self, leads):
        """Save leads to CSV file."""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"leads_{timestamp}.csv"
        filepath = os.path.join(self.output_dir, filename)

        if not leads:
            logger.warning("No leads to save")
            return filepath

        fieldnames = leads[0].keys()

        try:
            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(leads)

            logger.info(f"Saved leads to {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Failed to save CSV: {str(e)}")
            raise

def main():
    """Main entry point."""
    try:
        exporter = CRMExporter()
        output_file, leads = exporter.export_leads()

        print(json.dumps({
            'success': True,
            'message': f'Successfully exported {len(leads)} leads',
            'file': output_file,
            'count': len(leads)
        }))

    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
        exit(1)

if __name__ == '__main__':
    main()
