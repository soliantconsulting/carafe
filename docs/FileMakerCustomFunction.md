
# FileMaker Custom Function

```
/**
 * @SIGNATURE:
 * _carafeTemplateMerge ( packageName; jsonData ; implementationSemanticVersion )
 *
 * @PARAMETERS:
 * packageName - Required. Must be a valid Carafe package name.
 * jsonData - Optional. Must be valid JSON. The JSON passed in here will be available to JavaScript from `Carafe.getData()`.
 * implementationSemanticVersion - May be an empty string or a valid semantic version. Leaving it empty will return the default implementation from the newest package version available.
 *
 * @HISTORY:
 * Created: 2018-Aug-01 by Jeremiah Small
 *
 * @PURPOSE:
 * This function merges together a Carafe package, JSON data, and an optional custom implementation.
 *
 * @RESULT:
 * A successful result will be a valid HTML document with all the dependencies and data included in it.
 *
 * @ERRORS:
 * This function does not return any custom errors.
 *
 * @NOTES:
 * The Carafe project is on GitHub: https://github.com/soliantconsulting/carafe
 */


Let ( [
  // Lookup specified or latest implementationId if one exists
  implementationId = If ( IsEmpty ( implementationSemanticVersion ) ;
    ExecuteSQL("SELECT ImplementationId FROM CarafeImplementation CI WHERE CI.CarafePackageName = ?
      ORDER BY CI.ImplementationSemanticVersionMajor DESC, CI.ImplementationSemanticVersionMinor DESC, CI.ImplementationSemanticVersionPatch DESC
        FETCH FIRST 1 ROW ONLY"; ""; ""; packageName);
    ExecuteSQL("SELECT ImplementationId FROM CarafeImplementation CI WHERE CI.CarafePackageName = ? AND CI.CarafePackageTag = ?";
        ""; ""; packageName ; implementationSemanticVersion)
  );

  // Lookup specified or latest packageTag
  packageTag = If ( IsEmpty ( implementationId );
    ExecuteSQL("SELECT CarafePackageTag FROM CarafePackage CP WHERE CP.CarafePackageName = ?
      ORDER BY CP.CarafePackageSemanticVersionMajor DESC, CP.CarafePackageSemanticVersionMinor DESC, CP.CarafePackageSemanticVersionPatch DESC
        FETCH FIRST 1 ROW ONLY"; ""; ""; packageName);
    ExecuteSQL("SELECT CarafePackageTag FROM CarafeImplementation CI WHERE CI.ImplementationId = ?"; ""; ""; implementationId)
  );

  // Prepare common package SQL statement snippet
  carafePackageFromSqlSnippet = " FROM CarafePackage CP WHERE CP.CarafePackageName = ? AND CP.CarafePackageTag = ?";

  // Lookup the resources
  builtLibraryCss = ExecuteSQL("SELECT CarafePackageBuiltCss" & carafePackageFromSqlSnippet; ""; ""; packageName ; packageTag);
  builtLibraryJavaScript = ExecuteSQL("SELECT CarafePackageBuiltJavaScript" & carafePackageFromSqlSnippet; ""; ""; packageName ; packageTag);
  htmlTemplateImplementation = ExecuteSQL("SELECT ImplementationHtml FROM CarafeImplementation CI WHERE CI.ImplementationId = ?"; ""; ""; implementationId);

  // Prepare the output
  htmlTemplateOutput = If ( not IsEmpty ( implementationId );
    htmlTemplateImplementation;
    ExecuteSQL("SELECT CarafePackageExampleHtml" & carafePackageFromSqlSnippet; ""; ""; packageName ; packageTag)
  );
  jsonDataOutput = If ( not IsEmpty ( jsonData );
    jsonData;
    ExecuteSQL("SELECT CarafePackageexampleJsonData" & carafePackageFromSqlSnippet; ""; ""; packageName ; packageTag)
  );

  // Define the text boundaries
  startTag = "<!-- carafeZoneStart -->" ;
  endTag = "<!-- carafeZoneEnd  -->" ;
  endTagLength = Length ( endTag ) ;
  startPos = Position ( htmlTemplateOutput ; startTag ; 0 ; 1 ) ;
  endPos = Position ( htmlTemplateOutput ; endTag ; 0 ; 1 );
  styleTagLibrary = "<style>" & builtLibraryCss & "</style>¶";
  scriptTagLibraryContent = "<script type=\"text/javascript\">" & builtLibraryJavaScript & "</script>¶";
  scriptTagData = "<script type=\"text/javascript\">Carafe.setData(" & jsonDataOutput & "); Carafe.setIsFileMakerWebViewer();</script>¶";
  headTags = styleTagLibrary & scriptTagLibraryContent & scriptTagData
];

  // Output the result
  If ( startPos and endPos ;
    Replace ( htmlTemplateOutput ; startPos ; ( endPos - startPos ) + endTagLength ; headTags) ;
    htmlTemplateOutput
  )
)
```
