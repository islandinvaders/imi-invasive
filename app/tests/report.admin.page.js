import { Selector } from 'testcafe';

class ReportAdminPage {
  constructor() {
    this.pageId = '#reports';
    this.pageSelector = Selector(this.pageId);
  }

  /** Asserts that this page is currently displayed. */
  async isDisplayed(testController) {
    await testController.expect(this.pageSelector.exists).ok();
  }

  async editReport(testController, report) {
    await testController.wait(500);
    await this.clearInput(testController, '#edit-report-image');
    await testController.typeText('#edit-report-image', report.image);
    await this.clearInput(testController, '#edit-report-pestname');
    await testController.typeText('#edit-report-pestname', report.pestName);
    await testController.click('#edit-report-island'); // Click to open the dropdown
    if (report.island) {
      await testController.click(Selector('#edit-report-island option').withText(report.island));
    }
    await testController.expect(Selector('#edit-report-island option').withText(report.island).exists).ok(); // Ensure the selected island exists
    await this.clearInput(testController, '#edit-report-location');
    await testController.typeText('#edit-report-location', report.location);
    await this.clearInput(testController, '#edit-report-description');
    await testController.typeText('#edit-report-description', report.pestDescription);
    // Stuck here
    await testController.click('#edit-report-verified');
    await testController.click(Selector('#edit-report-verified option').withText(report.verified));
    await testController.click('#edit-report-removed');
    await testController.click(Selector('#edit-report-removed option').withText(report.removed));
    //
    await testController.click('#edit-report-submit input.btn.btn-primary');
  }

  async clearInput(testController, selector) {
    await testController.selectText(selector).pressKey('delete');
    await testController.wait(500);
  }
}

export const reportAdminPage = new ReportAdminPage();
