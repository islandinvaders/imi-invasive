import { Selector } from 'testcafe';

class Resourceform {
  constructor() {
    this.pageId = '#addresourceform';
    this.pageSelector = Selector(this.pageId);
  }

  /** Asserts that this page is currently displayed. */
  async isDisplayed(testController) {
    await testController.expect(this.pageSelector.exists).ok();
  }

  async addResource(testController, species) {
    await testController.typeText('#add-resource-image', species.image);
    await testController.typeText('#add-resource-pestName', species.pestName);
    await testController.typeText('#add-resource-sciName', species.sciName);
    await testController.typeText('#add-resource-risk', species.risk);
    await testController.typeText('#add-resource-regStatus', species.regStatus);
    await testController.typeText('#add-resource-pestType', species.pestType);
    await testController.typeText('#add-resource-description', species.description);
    await testController.typeText('#add-resource-impact', species.impact);
    await testController.typeText('#add-resource-distribution', species.distribution);
    await testController.typeText('#add-resource-lookalike', species.lookalike);
    await testController.click('#add-resource-submit-button input.btn.btn-primary');
  }

}

export const resourcesFormPage = new Resourceform();
