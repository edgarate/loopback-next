// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/example-lb3-application
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {OpenApiSpec} from '@loopback/rest';
import {Client, expect} from '@loopback/testlab';
import * as _ from 'lodash';
import {CoffeeShopApplication} from '../../../src';
import {givenCoffeeShop, setupApplication} from './test-helper';

const {generateSwaggerSpec} = require('loopback-swagger');
const swagger2openapi = require('swagger2openapi');

const lb3App = require('../../../lb3app/server/server');

describe('CoffeeShopApplication', () => {
  let app: CoffeeShopApplication;
  let client: Client;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
  });

  after('closes application', async () => {
    if (app) await app.stop();
  });

  context('basic REST calls for LoopBack 3 application', () => {
    it('creates and finds a CoffeeShop', async () => {
      const coffeeShop = givenCoffeeShop();
      const response = await client
        .post('/api/CoffeeShops')
        .send(coffeeShop)
        .expect(200);

      expect(response.body).to.containDeep(
        _.pick(coffeeShop, ['name', 'city']),
      );

      const result = await client.get(`/api/CoffeeShops/${response.body.id}`);
      expect(result.body).to.containDeep(_.pick(coffeeShop, ['name', 'city']));
    });

    it("gets the CoffeeShop's status", async () => {
      const currentDate = new Date();
      const currentHour = currentDate.getHours();
      const response = await client.get('/api/CoffeeShops/status').expect(200);

      if (currentHour >= 6 && currentHour < 20) {
        expect(response.body.status).to.eql('We are open for business.');
      } else {
        expect(response.body.status).to.eql(
          'Sorry, we are closed. Open daily from 6am to 8pm.',
        );
      }
    });

    it('gets external route in application', async () => {
      await client.get('/ping').expect(200, 'pong');
    });
  });

  context('LoopBack 3 authentication', () => {
    // tslint:disable-next-line:no-any
    let User: any;

    before(() => {
      User = lb3App.models.User;
    });

    it('creates and logs in a User', async () => {
      const user = await User.create({
        email: 'created@email.com',
        password: 'L00pBack!',
      });

      expect(user.email).to.eql('created@email.com');

      await User.login({
        email: 'created@email.com',
        password: 'L00pBack!',
      });
    });

    it('makes an authenticated request', async () => {
      await User.create({
        email: 'sample@email.com',
        password: 'L00pBack!',
      });

      // await client.get('/api/CoffeeShops/greet').expect(401);

      const token = await User.login({
        email: 'sample@email.com',
        password: 'L00pBack!',
      });

      const response = await client
        .get(`/api/CoffeeShops/greet?access_token=${token.id}`)
        .expect(200);

      expect(response.body.undefined).to.eql('Hello from this Coffee Shop');
    });

    it.skip("denies request made by another user's access token", async () => {
      const users = await User.create([
        {
          email: 'sample@email.com',
          password: 'L00pBack!',
        },
        {
          email: 'other@email.com',
          password: 'L00pBack!',
        },
      ]);

      const token = await User.login({
        email: users[0].email,
        password: 'L00pBack!',
      });

      const otherToken = await User.login({
        email: users[1].email,
        password: 'L00pBack!',
      });

      const response = await client
        .get(`/api/Users/${users[0].id}?access_token=${token.id}`)
        .expect(200);

      expect(response.body).to.containEql({
        email: users[0].email,
        id: users[0].id,
      });

      await client
        .get(`/api/Users/${users[0].id}?access_token=${otherToken.id}`)
        .expect(401);
    });
  });

  context('OpenAPI spec', () => {
    let apiSpec: OpenApiSpec;
    let swaggerSpec: OpenApiSpec;
    let lb3Spec: OpenApiSpec;

    before(async () => {
      apiSpec = app.restServer.getApiSpec();
      swaggerSpec = await generateSwaggerSpec(lb3App);
      const result = await swagger2openapi.convertObj(swaggerSpec, {});
      lb3Spec = result.openapi;
    });

    it('has the same properties in both the LB3 and LB4 specs', () => {
      const lb4SpecProperties = Object.keys(apiSpec).sort();
      const lb3SpecProperties = Object.keys(lb3Spec).sort();

      expect(lb4SpecProperties).to.eql(lb3SpecProperties);
    });

    it('uses OpenApi version 3', () => {
      expect(apiSpec.openapi).to.eql('3.0.0');
    });

    it('transfers the tags from the LB3 spec to the LB4 spec', () => {
      expect(apiSpec.tags).to.eql(swaggerSpec.tags);
    });

    it('transfers the components from the LB3 spec to the LB4 spec', () => {
      if (apiSpec.components && lb3Spec.components) {
        expect(apiSpec.components.schemas).to.eql(lb3Spec.components.schemas);
      }
    });

    it('appends the basePath and transfers the paths from the LB3 spec to the LB4 spec', () => {
      const lb3Paths = Object.keys(lb3Spec.paths).map(
        path => swaggerSpec.basePath + path,
      );
      const lb4SpecPaths = Object.keys(apiSpec.paths);

      expect(lb4SpecPaths).to.eql(lb3Paths);

      const lb4SpecPathsInfo = Object.values(apiSpec.paths);
      const lb3SpecPathsInfo = Object.values(lb3Spec.paths);

      expect(lb4SpecPathsInfo).to.deepEqual(lb3SpecPathsInfo);
    });
  });
});
