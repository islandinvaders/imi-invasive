import { Selector } from 'testcafe';

class ReportPage {
  constructor() {
    this.pageId = '#reports';
    this.pageSelector = Selector(this.pageId);
  }

  /** Asserts that this page is currently displayed. */
  async isDisplayed(testController) {
    await testController.expect(this.pageSelector.exists).ok();
  }

  async makeReport(testController, report) {
    await testController.wait(1000);
    await testController.typeText('#report-image', report.image);
    await testController.typeText('#report-pestname', report.pestName);
    await testController.click('#report-island'); // Click to open the dropdown
    if (report.island) {
      await testController.click(Selector('#report-island option').withText(report.island));
    }
    await testController.expect(Selector('#report-island option').withText(report.island).exists).ok(); // Ensure the selected island exists
    await testController.typeText('#report-location', report.location);
    await testController.typeText('#report-description', report.pestDescription);
    await testController.click('#report-submit input.btn.btn-primary');
  }
}

export const reportPage = new ReportPage();
