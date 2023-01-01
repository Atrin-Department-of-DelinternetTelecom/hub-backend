export default abstract class Bonusable {
  /**
   * Activate a bonus for the service.
   *
   * This method should contain the logic required to activate a bonus on the service
   * (e.g., applying discounts, enabling special features, etc.).
   *
   * @throws {Error} If the bonus activation process fails due to invalid state, service unavailability, or other unforeseen issues.
   */
  abstract activateBonus(
    contractId: number,
    bonusId: number,
    options: Record<string, unknown>,
  ): void;

  /**
   * Deactivate a bonus for the service.
   *
   * This method should contain the logic required to deactivate a bonus on the service
   * (e.g., removing discounts, disabling special features, etc.).
   *
   * @throws {Error} If the bonus deactivation process fails due to invalid state, service unavailability, or other unforeseen issues.
   */
  abstract deactivateBonus(
    contractId: number,
    bonusId: number,
    options: Record<string, unknown>,
  ): void;
}
