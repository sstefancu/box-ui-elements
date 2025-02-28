import React, { useState, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import withCurrentUser from '../../elements/common/current-user';
import BoxAiLogo from '../../icon/logo/BoxAiLogo';
import ContentAnswersModalContent from './ContentAnswersModalContent';
import ContentAnswersModalFooter from './ContentAnswersModalFooter';
// @ts-ignore flow import
import Modal from '../../components/modal/Modal';
// @ts-ignore: no ts definition
// eslint-disable-next-line import/named
import { BoxItem, User } from '../../../common/types/core';
// @ts-ignore: no ts definition
import { withAPIContext } from '../../elements/common/api-context';
// @ts-ignore: no ts definition
import APIFactory from '../../api';
// @ts-ignore: no ts definition
// eslint-disable-next-line import/named
import { ElementsXhrError } from '../../common/types/api';

import messages from './messages';

import './ContentAnswersModal.scss';

export type QuestionType = {
    answer?: string;
    createdAt?: string;
    error?: ElementsXhrError;
    prompt: string;
};

type Props = {
    api: APIFactory;
    currentUser?: User;
    file: BoxItem;
    isOpen: boolean;
    onAsk: () => void;
    onRequestClose: () => void;
};

const ContentAnswersModal = ({ api, currentUser, file, isOpen, onAsk, onRequestClose }: Props) => {
    const fileName = file && file.name;
    const [hasError, setHasError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [questions, setQuestions] = useState<QuestionType[]>([]);

    const handleSuccessCallback = useCallback((response): void => {
        const question = {
            answer: response.data.answer,
            createdAt: response.data.created_at,
        };

        setQuestions(prevState => {
            const lastQuestion = prevState[prevState.length - 1];
            return [...prevState.slice(0, -1), { ...lastQuestion, ...question }];
        });
    }, []);

    const handleErrorCallback = useCallback((error: ElementsXhrError): void => {
        setHasError(true);
        setQuestions(prevState => {
            const lastQuestion = prevState[prevState.length - 1];
            return [...prevState.slice(0, -1), { ...lastQuestion, error }];
        });
    }, []);

    const handleAsk = useCallback(
        async (prompt: string, isRetry = false) => {
            setHasError(false);
            onAsk();
            const id = file && file.id;
            const items = [
                {
                    id,
                    type: 'file',
                },
            ];

            const nextQuestions = [...(isRetry ? questions.slice(0, -1) : questions)];
            setQuestions([...nextQuestions, { prompt }]);

            setIsLoading(true);
            try {
                const response = await api.getIntelligenceAPI(true).ask(prompt, items);
                handleSuccessCallback(response);
            } catch (e) {
                handleErrorCallback(e);
            }
            setIsLoading(false);
        },
        [api, file, handleErrorCallback, handleSuccessCallback, onAsk, questions],
    );

    const handleRetry = useCallback(() => {
        handleAsk(questions[questions.length - 1].prompt, true);
    }, [handleAsk, questions]);

    return (
        <Modal
            className="bdl-ContentAnswersModal"
            data-testid="content-answers-modal"
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title={
                <>
                    <BoxAiLogo
                        className="bdl-BoxAiLogo"
                        data-testid="content-answers-icon-color"
                        width={32}
                        height={32}
                    />
                    <FormattedMessage {...messages.contentAnswersTitle} />
                </>
            }
        >
            <ContentAnswersModalContent
                currentUser={currentUser}
                data-testid="content-answers-modal-content"
                fileName={fileName}
                isLoading={isLoading}
                questions={questions}
            />
            <ContentAnswersModalFooter
                currentUser={currentUser}
                data-testid="content-answers-modal-footer"
                hasError={hasError}
                isLoading={isLoading}
                onAsk={handleAsk}
                onRetry={handleRetry}
            />
        </Modal>
    );
};

export default withAPIContext(withCurrentUser(ContentAnswersModal));
