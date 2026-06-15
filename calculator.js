const form = document.querySelector("#calculatorForm");

const fields = {
  wasteKg: document.querySelector("#wasteKg"),
  weeks: document.querySelector("#weeks"),
  organicShare: document.querySelector("#organicShare"),
  setupType: document.querySelector("#setupType"),
  pricePerKg: document.querySelector("#pricePerKg")
};

const outputs = {
  wasteKgValue: document.querySelector("#wasteKgValue"),
  weeksValue: document.querySelector("#weeksValue"),
  organicShareValue: document.querySelector("#organicShareValue"),
  totalWaste: document.querySelector("#totalWaste"),
  compostMass: document.querySelector("#compostMass"),
  volumeReduction: document.querySelector("#volumeReduction"),
  co2Saved: document.querySelector("#co2Saved"),
  setupCost: document.querySelector("#setupCost"),
  compostValue: document.querySelector("#compostValue"),
  summaryText: document.querySelector("#summaryText")
};

const formatNumber = (value) => new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0
}).format(value);

const formatMoney = (value) => `${formatNumber(value)} ₸`;

function calculate() {
  const wastePerWeek = Number(fields.wasteKg.value);
  const weeks = Number(fields.weeks.value);
  const organicShare = Number(fields.organicShare.value);
  const setupCost = Number(fields.setupType.value);
  const pricePerKg = Math.max(0, Number(fields.pricePerKg.value) || 0);

  const totalWaste = wastePerWeek * weeks;
  const compostMass = totalWaste * 0.5;
  const co2SavedTon = totalWaste * 0.0005;
  const compostValue = compostMass * pricePerKg;
  const totalMixedWaste = totalWaste / (organicShare / 100);
  const paybackPercent = setupCost > 0 ? Math.min(100, (compostValue / setupCost) * 100) : 0;

  outputs.wasteKgValue.textContent = wastePerWeek;
  outputs.weeksValue.textContent = weeks;
  outputs.organicShareValue.textContent = organicShare;
  outputs.totalWaste.textContent = `${formatNumber(totalWaste)} кг`;
  outputs.compostMass.textContent = `${formatNumber(compostMass)} кг`;
  outputs.volumeReduction.textContent = "2,5x";
  outputs.co2Saved.textContent = `${co2SavedTon.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} т`;
  outputs.setupCost.textContent = formatMoney(setupCost);
  outputs.compostValue.textContent = formatMoney(compostValue);
  outputs.summaryText.textContent = `При таких параметрах из примерно ${formatNumber(totalMixedWaste)} кг общего мусора можно выделить ${formatNumber(totalWaste)} кг органики. Оценочная ценность компоста покрывает около ${Math.round(paybackPercent)}% стоимости выбранной комплектации.`;
}

form.addEventListener("input", calculate);
form.addEventListener("change", calculate);
calculate();
