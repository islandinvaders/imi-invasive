import { Selector } from 'testcafe';

class ResourcesAdminPage {
  constructor() {
    this.pageId = '#resources-admin';
    this.pageSelector = Selector(this.pageId);
  }

  /** Asserts that this page is currently displayed. */
  async isDisplayed(testController) {
    await testController.expect(this.pageSelector.exists).ok();
  }

  async search(testController, pestName) {
    await testController.typeText('#resources-search', pestName);
  }

  async filter(testController, type) {
    await this.isDisplayed(testController);
    await testController.click('#resources-filter');
    if (type === 'Select One') {
      await testController.click('#resources-filter-select-one');
    } else if (type === 'Plant') {
      await testController.click('#resources-filter-plant');
    } else if (type === 'Animal') {
      await testController.click('#resources-filter-animal');
    } else if (type === 'Bug') {
      await testController.click('#resources-filter-bug');
    } else if (type === 'Microbe') {
      await testController.click('#resources-filter-microbe');
    } else {
      await testController.click('#resources-filter-fungus');
    }
  }

  async deleteResource(testController) {
    await this.isDisplayed(testController);
    await testController.click('#resource-admin-delete');
  }
}

export const resourcesAdminPage = new ResourcesAdminPage();
