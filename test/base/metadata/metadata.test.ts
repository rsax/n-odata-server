/// <reference path="../../../typings/index.d.ts" />
/**
 * Created by helmut on 23.07.16.
 */

//import expect = require("chai").expect;
import chai = require("chai");
import {expect} from "chai";
import {assert} from "chai";
import {should} from "chai";
import {LoopbackModelClass} from "../../lib/types/loopbacktypes";
import lb_constants = require("../../lib/constants/loopback_constants");
import {Request} from "express-serve-static-core";
import {Response} from "express-serve-static-core";
import {Metadata} from "../../../lib/base/metadata/metadata";
import {LoopbadkApp} from "../../../lib/types/loopbacktypes";
import chaiAsPromised = require("chai-as-promised");
import sinonChai = require("~sinon-chai/index");
import Sinon = require("sinon");
import proxyquire = require("proxyquire");
import {LoopbackModelProperty} from "../../../lib/types/loopbacktypes";

/* see here for a good description of chai-as-promised: http://www.sitepoint.com/promises-in-javascript-unit-tests-the-definitive-guide/ */

describe("Metadata", function () {
	before(function () {
		chai.use(chaiAsPromised);
		chai.should();	// found this hack on the internet. Needs to be called once otherwise tests with should fail
	});


	describe("buildMetadata", function () {
		let sut:Metadata;

		beforeEach(function () {
		});

		it("should build and return an empty metadata stream", function () {
			// create the model and the app that are used by the Metadata class to create the xml output
			let models = () => {
				return []
			};
			let app:LoopbadkApp = {models: models};
			// create the subject under test
			sut = new Metadata(app);

			// !!! It's important that this string is EXACTLY the same as the one that is generated by n-odata-server
			// Don't delete or add whitespace !!!
			let expectedString = `<?xml version="1.0" encoding="UTF-8"?>
<edmx:Edmx xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" Version="1.0">
  <edmx:DataServices m:DataServiceVersion="2.0">
    <Schema xmlns="http://schemas.microsoft.com/ado/2008/09/edm" Namespace="NODATASERVER">
      <EntityType/>
      <Association/>
      <EntityContainer Name="NODATASERVER" m:IsDefaultEntityContainer="true">
        <EntitySet/>
        <AssociationSet/>
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`;

			// invoke the methode buildMetadata() on the sut
			let promise:Promise<any> = sut.buildMetadata();
			// check the assertions
			return promise.should.eventually.equal(expectedString);
		});

		/** In this test we create a simple model for which we want the metadata to be created
		 * We use some advanced testing techniques in here.
		 * So we use the proxyquire module to stub the commons module that is used inside the Metadata class.
		 * Additionally we use the */
		it("should build and return a simple metadata stream", function () {
			// Create the model from which the metadata should be build
			let simpleModel:LoopbackModelClass;
			simpleModel = {
				definition: {
					name: "MyModel",
					columnNames: function () {
						return ["MyProp1", "MyProp2"] as Array<string>
					},
					properties: {
						MyProp1: {
							id: "MyProp1"
						},
						MyProp2: {
							id: "MyProp2"
						}
					},
					settings: {
						relations: []
					}
				}
			} as LoopbackModelClass;

			// Stubbing the commons module that is used in metadata.ts
			let commonsStub:any = {};
			commonsStub.convertType = (property) => {
				return "Edm.String"
			};
			commonsStub.getPluralForModel = (model) => {
				return "MyModels"
			};
			// create the proxyquire proxy for metadata with the injected module stubs
			let sutProxy = proxyquire("../../../lib/base/metadata/metadata", {'../../common/odata_common': commonsStub});

			// create the Model and the app that are used by the Metadata module
			let models = () => {
				return [simpleModel]
			};
			let app:LoopbadkApp = {models: models};
			// create the subject under test with the proxyquire proxy
			let sut = new sutProxy.Metadata(app);

			// !!! It's important that this string is EXACTLY the same as the one that is generated by n-odata-server
			// Don't delete or add whitespace !!!
			let expectedString = `<?xml version="1.0" encoding="UTF-8"?>
<edmx:Edmx xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" Version="1.0">
  <edmx:DataServices m:DataServiceVersion="2.0">
    <Schema xmlns="http://schemas.microsoft.com/ado/2008/09/edm" Namespace="NODATASERVER">
      <EntityType Name="MyModel">
        <Key>
          <PropertyRef Name="MyProp2"/>
        </Key>
        <Property Name="MyProp1" Type="Edm.String"/>
        <Property Name="MyProp2" Type="Edm.String"/>
      </EntityType>
      <Association/>
      <EntityContainer Name="NODATASERVER" m:IsDefaultEntityContainer="true">
        <EntitySet Name="MyModels" EntityType="NODATASERVER.MyModel"/>
        <AssociationSet/>
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`;

			// Invoike the buildMetadata() function of Metadata class
			let promise:Promise<any> = sut.buildMetadata();
			// check the assertions
			return promise.should.eventually.equal(expectedString);
		});

	});
});
