const FMR_V3_VIEWS = Object.freeze({
  field: 'Field',
  admin: 'Admin',
  owner: 'Owner'
});

function doGet(e) {
  const requested = String(
    e && e.parameter && e.parameter.view
      ? e.parameter.view
      : 'field'
  ).trim().toLowerCase();

  const view = Object.prototype.hasOwnProperty.call(
    FMR_V3_VIEWS,
    requested
  ) ? requested : 'field';

  const template = HtmlService.createTemplateFromFile('Index');
  template.requestedView = view;
  template.webAppUrl = ScriptApp.getService().getUrl();

  return template
    .evaluate()
    .setTitle(`FMR Operations v3 — ${FMR_V3_VIEWS[view]}`)
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );
}

function includeFmrV3_(fileName) {
  return HtmlService
    .createHtmlOutputFromFile(fileName)
    .getContent();
}