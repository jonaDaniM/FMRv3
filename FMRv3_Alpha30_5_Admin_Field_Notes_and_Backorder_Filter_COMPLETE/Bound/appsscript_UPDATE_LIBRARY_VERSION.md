# Bound appsscript.json

The current GitHub manifest still points to FMRCore version `35`.

After publishing Alpha 30.5 Core, update BOTH TEST and PROD Bound manifests to
the exact new immutable Core library version Apps Script creates.

Do not guess the number.

After PROD validation, push the final `appsscript.json` value to GitHub so
source control reflects the deployed dependency.
