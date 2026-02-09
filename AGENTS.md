Project structure:

- Folder for Page Objects: test-elements\views
- Folder for Subviews ("inner" Page Objects): test-elements\subviews
- Repeating pieces of functionality: test-elements\flows

Rules regarding Page Objects:

1. Prefer splitting Views into Subviews and use composition to combine them.
2. Page Objects (Views/Subviews) should be created as a Class type.
3. Prefer `getByRole`, `getByLabel`, and `getByTestId` locators. Use CSS locators only when needed.
4. Keep selectors stable: prefer `data-testid` for UI lists/cards/dialogs.
5. Each View/Subview must have a short JSDoc description above the class.
6. Element locators and element-specific accessors must be defined in the owning Page Object/Subview. Parent Views should not duplicate child element access; they should return the child object, and tests should interact through the child’s API.

Rules regarding tests:

1. Never hide main test's verifications from the test body (don't extract them to functions).
2. Analyze if a test has a pre-setup; if so, extract it to `test.beforeEach`/`test.beforeAll`.
3. If a test creates data, ensure there is a corresponding cleanup in `test.afterEach`/`test.afterAll`.
4. Test data should be unique (timestamp/uuid) to avoid collisions in shared environments.

Rules regarding types:

1. Prefer reusing existing domain/API types as the single source of truth; introduce new types only when they model truly new behavior or a distinct contract, not as convenience wrappers over the same data shape.
