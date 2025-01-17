// Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { getRequestType, HandlerInput } from 'ask-sdk-core';
import { interfaces, SlotValue } from "ask-sdk-model";
import * as _ from 'lodash';
import { RecommendationResult } from './catalog-provider';
import APIInvocationRequest = interfaces.conversations.APIInvocationRequest;

// util to find if a request is a API request, optionally for a specific API
export const isApiRequest = (handlerInput: HandlerInput, apiName?: string) => {
    const isApiRequest = getRequestType(handlerInput.requestEnvelope) === 'Dialog.API.Invoked';
    if (apiName) {
        return isApiRequest && getAPIName(handlerInput) === apiName;
    } else {
        return isApiRequest;
    }
};

// util to determine if a request is a API request where the API name starts wth the given
// prefix
export const isApiRequestPrefix = (handlerInput: HandlerInput, apiName: string): boolean => {
    const isApiRequest = getRequestType(handlerInput.requestEnvelope) === 'Dialog.API.Invoked';
    return isApiRequest && (getAPIName(handlerInput)?.startsWith(apiName) || false);
};

// util to get the API name from a API request
export const getAPIName = (handlerInput: HandlerInput) => {
    return (handlerInput.requestEnvelope.request as APIInvocationRequest).apiRequest?.name;
};

// util to get the raw arguments for a API request
export const getApiArguments = (handlerInput: HandlerInput) => {
    return (handlerInput.requestEnvelope.request as APIInvocationRequest).apiRequest?.arguments || {};
};

// util to get the resolved slot value Objects for a API request
export const getApiSlots = (handlerInput: HandlerInput) => {
    return (handlerInput.requestEnvelope.request as APIInvocationRequest).apiRequest?.slots || {};
};

// util to get the resolved value from a slot value object
export const getSlotResolvedValue = (slot: SlotValue) => {
    const resolutionsPerAuthority = _.get(slot, 'resolutions.resolutionsPerAuthority');
    for (const resolutionPerAuthority of resolutionsPerAuthority) {
        if (_.get(resolutionPerAuthority,'status.code') === "ER_SUCCESS_MATCH") {
            const firstAuthorityValue = _.first(_.get(resolutionPerAuthority, 'values'));
            return _.get(firstAuthorityValue, 'value.name');
        }
    }
    return null;
};

// util to get a object containing the resolved slot values for all slots in a API request
export const getResolvedApiSlotValues = (handlerInput: HandlerInput) => {
    const slots = getApiSlots(handlerInput);
    const resolvedSlotValues: any = {};
    for (const slotName of Object.keys(slots)) {
        resolvedSlotValues[slotName] = getSlotResolvedValue(slots[slotName]);
    }
    return resolvedSlotValues;
};

// util to convert recommedationResult's rescoped field from boolean to number
export const modifyRecommendationResultRescoped = (recommendationResult: RecommendationResult<any, any>) => {
    //explicity converting it to any, to avoid type check when converting rescoped boolean to number
    const modifiedRecommendationResult: any = JSON.parse(JSON.stringify(recommendationResult));
    modifiedRecommendationResult.rescoped = recommendationResult.rescoped ? 1 : 0;
    return modifiedRecommendationResult;
}

// util to get the id of the resolved value in a slot value object
export const getSlotResolvedId = (slot: SlotValue) => {
    const resolutionsPerAuthority = _.get(slot, 'resolutions.resolutionsPerAuthority');
    for (const resolutionPerAuthority of resolutionsPerAuthority) {
        if (_.get(resolutionPerAuthority,'status.code') === "ER_SUCCESS_MATCH") {
            const firstAuthorityValue = _.first(_.get(resolutionPerAuthority, 'values'));
            return _.get(firstAuthorityValue, 'value.id');
        }
    }
    return null;
};

// util to get a object containing the ids of the resolved slot values for a API request
export const getResolvedApiSlotIds = (handlerInput: HandlerInput) => {
    const slots = getApiSlots(handlerInput);
    const resolvedSlotIds: any = {};
    for (const slotName of Object.keys(slots)) {
        resolvedSlotIds[slotName] = getSlotResolvedId(slots[slotName]);
    }
    return resolvedSlotIds;
};
