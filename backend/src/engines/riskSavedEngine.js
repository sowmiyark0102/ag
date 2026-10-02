/**
 * Transparent, config-driven ₹ Risk Saved estimator.
 * Never claims guaranteed savings - always shows the assumption used.
 */

const DEFAULT_ASSUMED_LOSS_PERCENTAGE = 40;

function calculateRiskSaved({ quantity, unitCost, assumedLossPercentage }) {
  const assumption =
    typeof assumedLossPercentage === "number" ? assumedLossPercentage : DEFAULT_ASSUMED_LOSS_PERCENTAGE;

  const estimatedPotentialLoss = Math.round(quantity * unitCost * (assumption / 100));

  return {
    enteredQuantity: quantity,
    unitCost,
    assumedLossPercentage: assumption,
    estimatedPotentialLoss,
    formula: "Estimated Potential Loss = Quantity x Unit Cost x Assumed Loss Percentage",
    disclaimer:
      "Estimated potential avoidable loss based on the entered quantity and configured assumptions. Actual financial impact may differ.",
  };
}

module.exports = { calculateRiskSaved, DEFAULT_ASSUMED_LOSS_PERCENTAGE };
