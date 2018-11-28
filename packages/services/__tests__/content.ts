import axios from 'axios';
// @ts-ignore
import httpAdapter from 'axios/lib/adapters/http';
// @ts-ignore
import nock from 'nock';
import {ContentServiceImpl, FeedPublication, Publication} from '../src';
import {expected as latestExpected, response as latestResponse} from './fixtures/latest';
import {expected as bookExpected, response as bookResponse} from './fixtures/bookmarks';
import {expected as feedPubsExpected, response as feedPubsResponse} from './fixtures/feedPubs';

axios.defaults.adapter = httpAdapter;

const baseURL = 'http://localhost:3000';
const service = new ContentServiceImpl(baseURL, 5);

it('should fetch publications from server', async () => {
    const expected: Publication[] = require('./fixtures/pubs.json');
    nock(baseURL)
        .get('/v1/publications')
        .reply(200, expected);

    const actual = await service.fetchPublications();

    expect(actual).toEqual(expected);
});

it('should fetch latest posts from server', async () => {
    nock(baseURL)
        .get('/v1/posts/latest')
        .query({
            latest: '2018-11-28T08:27:45.612Z',
            page: 0,
            pageSize: 5,
            pubs: 'airbnb,alligator,angular',
        })
        .reply(200, latestResponse);

    const actual = await service.fetchLatestPosts(
        new Date('2018-11-28T08:27:45.612Z'),
        0,
        ['airbnb', 'alligator', 'angular'],
    );

    expect(actual).toEqual(latestExpected);
});

it('should fetch personal latest posts from server', async () => {
    nock(baseURL)
        .matchHeader('authorization', 'Bearer token')
        .get('/v1/posts/latest')
        .query({
            latest: '2018-11-28T08:27:45.612Z',
            page: 0,
            pageSize: 5,
        })
        .reply(200, latestResponse);

    service.setAccessToken('token');

    const actual = await service.fetchLatestPosts(
        new Date('2018-11-28T08:27:45.612Z'),
        0,
    );

    expect(actual).toEqual(latestExpected);
});

it('should clear access token', async () => {
    nock(baseURL)
        .matchHeader('authorization', 'Bearer token')
        .get('/v1/posts/latest')
        .query(true)
        .reply(200, latestResponse);

    service.setAccessToken('token');

    await service.fetchLatestPosts(
        new Date('2018-11-28T08:27:45.612Z'),
        0,
    );

    nock(baseURL)
        .matchHeader('authorization', (val: string) => !val)
        .get('/v1/posts/latest')
        .query(true)
        .reply(200, latestResponse);

    service.clearAccessToken();

    await service.fetchLatestPosts(
        new Date('2018-11-28T08:27:45.612Z'),
        0,
    );
});

it('should fetch bookmarks from server', async () => {
    nock(baseURL)
        .matchHeader('authorization', 'Bearer token')
        .get('/v1/posts/bookmarks')
        .query({
            latest: '2018-11-28T08:27:45.612Z',
            page: 0,
            pageSize: 5,
        })
        .reply(200, bookResponse);

    service.setAccessToken('token');

    const actual = await service.fetchBookmarks(
        new Date('2018-11-28T08:27:45.612Z'),
        0,
    );

    expect(actual).toEqual(bookExpected);
});

it('should fetch feed pubs from server', async () => {
    nock(baseURL)
        .matchHeader('authorization', 'Bearer token')
        .get('/v1/feeds/publications')
        .reply(200, feedPubsResponse);

    service.setAccessToken('token');

    const actual = await service.fetchFeedPublications();

    expect(actual).toEqual(feedPubsExpected);
});

it('should update feed pubs', async () => {
    const body: FeedPublication[] = [{
        publicationId: 'angular',
        enabled: false,
    }];

    nock(baseURL)
        .matchHeader('authorization', 'Bearer token')
        .post('/v1/feeds/publications', body)
        .reply(204);

    service.setAccessToken('token');

    await service.updateFeedPublications(body);
});

it('should add bookmarks', async () => {
    const body: string[] = ['id'];

    nock(baseURL)
        .matchHeader('authorization', 'Bearer token')
        .post('/v1/posts/bookmarks', body)
        .reply(204);

    service.setAccessToken('token');

    await service.addBookmarks(body);
});

it('should remove bookmark', async () => {
    const id = 'id';

    nock(baseURL)
        .matchHeader('authorization', 'Bearer token')
        .delete(`/v1/posts/${id}/bookmark`)
        .reply(204);

    service.setAccessToken('token');

    await service.removeBookmark(id);
});