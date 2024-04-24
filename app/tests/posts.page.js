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

  async search(testController, pestName) {
    await testController.typeText('#resources-search', pestName);
  }
}

export const postsPage = new PostsPage();
