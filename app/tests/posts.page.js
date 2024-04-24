import { Selector } from 'testcafe';

class PostsPage {
  constructor() {
    this.pageId = '#resources';
    this.pageSelector = Selector(this.pageId);
  }

  /** Asserts that this page is currently displayed. */
  async isDisplayed(testController) {
    await testController.expect(this.pageSelector.exists).ok();
  }

  async switchDisplay(testController) {
    await testController.click('#toggle-button');
  }

  async downloadCSV(testController) {
    await testController.click('#download-button');
  }
}

export const postsPage = new PostsPage();
