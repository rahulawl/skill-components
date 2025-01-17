// Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { HandlerInput } from 'ask-sdk-core';
import { Response } from "ask-sdk-model";

import { apiNamespace } from '../config';
import { ListNav, ListReference } from '../interface';
import { ListProvider, Page } from '../list-provider';
import { ListNavSessionState, PageTokens } from '../session-state';
import * as util from '../util';
import { BaseApiHandler } from './base-api-handler';

interface Arguments {
    // reference to list being navigated
    listRef: ListReference;   

    // indicates the page to retrieve
    pageToken: string;
}

// called to get a specific page from the list being navigated with (identified by a given
// page token). Will actually rely on data stored in session state instead of arguments passed 
// in API call if ListNav.useSession is true
export class GetPageHandler extends BaseApiHandler {
    static defaultApiName = `${apiNamespace}.getPage`;

    constructor(
        apiName: string = GetPageHandler.defaultApiName
    ) {
        super(apiName);
    }

    handle(handlerInput : HandlerInput): Response {
        const args = util.getApiArguments(handlerInput) as Arguments;

        let page : Page<any>;
        if (ListNav.useSession) {
            page = this.getNewPageFromSession(handlerInput, args);
        } else {
            const listRef = args.listRef;
            const listProvider: ListProvider<any> = ListNav.getProvider(listRef);
            page = listProvider.getPage(args.pageToken, listRef.pageSize);
        }

        const responsePage = {
            items: page.items,
            itemCount: page.items.length,

            prevPageToken: page.prevPageToken,
            pageToken: page.pageToken,
            nextPageToken: page.nextPageToken
        };

        return handlerInput.responseBuilder
            .withApiResponse(responsePage)
            .withShouldEndSession(false)
            .getResponse();
    }

    getNewPageFromSession(handlerInput : HandlerInput, args: Arguments): Page<any> {
        const sessionState = ListNavSessionState.load(handlerInput);

        // get list ref out of session instead of arguments
        const listRef = sessionState.activeList;
        const listProvider: ListProvider<any> = ListNav.getProvider(listRef);
        
        // get page token out of session instead of arguments
        const pageToken = sessionState.upcomingPageToken;
        const page = listProvider.getPage(pageToken, listRef.pageSize);

        // save new current page to session
        sessionState.currentPageTokens = {
            prevPageToken: page.prevPageToken,
            currentPageToken: page.pageToken,
            nextPageToken: page.nextPageToken
        } as PageTokens;
        sessionState.upcomingPageToken = undefined; // will be set again before next call to getPage API
        sessionState.save(handlerInput);

        sessionState.validateArguments(args.listRef, args.pageToken);

        return page;
    }
}
