describe('Positive Tests', () => {
  describe('Security Tests', () => {
    // 1. check authorization
    // 2. check ACL
    it.todo('should pass operation for valid user');
  });
  describe('Validation Tests', () => {
    // 1. check by minimum inputs
    // 2. check by all inputs
    it.todo('should pass validation for valid inputs');
  });
  describe('Edge-case Tests', () => {
    // 1. check edge-case inputs
    it.todo('should pass for valid edge-cases');
  });
  describe('Opertaion Tests', () => {
    // have to check:
    // 1. response code
    // 2. response data
    // 3. database insertion
    it.todo('should do opertaion for valid inputs');
  });
});
describe('Negetive Tests', () => {
  describe('Security Tests', () => {
    // 1. check authorization
    // 2. check ACL
    it.todo('prevent operation for invalid user');
  });
  describe('Validation Tests', () => {
    // 1. check by minimum inputs
    // 2. check by all inputs
    it.todo('throw error for invalid inputs');
  });
  describe('Edge-case Tests', () => {
    // 1. check edge-case inputs
    it.todo('prevent operation for invalid edge-cases');
  });
  describe('Opertaion Tests', () => {
    // have to check:
    // 1. response code
    // 2. response data
    // 3. transction rollbacks (ensure invalid data remove from database if requried)
    it.todo('prevent opertaion for invalid inputs');
  });
});
