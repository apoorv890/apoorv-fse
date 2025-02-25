import React from 'react';
import styled, { keyframes } from 'styled-components';

interface InsightsDisplayProps {
    insights: string[];
    questions: string[];
}

const slideIn = keyframes`
    from {
        transform: translateX(20px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
`;

const fadeIn = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const scaleIn = keyframes`
    from {
        transform: scale(0.95);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
`;

const InsightsContainer = styled.div`
    position: fixed;
    top: 40px;
    right: 40px;
    width: 400px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    padding: 20px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    z-index: 9998;
    animation: ${fadeIn} 0.3s ease-out;
    transform-origin: top right;
`;

const Section = styled.div`
    margin-bottom: 20px;
    animation: ${scaleIn} 0.3s ease-out;
    &:last-child {
        margin-bottom: 0;
    }
`;

const Title = styled.h3`
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #1a73e8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    animation: ${fadeIn} 0.3s ease-out;
`;

const List = styled.ul`
    margin: 0;
    padding: 0;
    list-style: none;
`;

const ListItem = styled.li<{ index: number }>`
    position: relative;
    padding-left: 20px;
    margin-bottom: 10px;
    font-size: 14px;
    line-height: 1.5;
    color: #333;
    animation: ${slideIn} 0.3s ease-out;
    animation-delay: ${props => props.index * 0.1}s;
    animation-fill-mode: both;

    &:before {
        content: "•";
        position: absolute;
        left: 0;
        color: #1a73e8;
        font-weight: bold;
    }

    &:last-child {
        margin-bottom: 0;
    }

    &:hover {
        transform: translateX(5px);
        transition: transform 0.2s ease;
    }
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 20px;
    color: #666;
    font-size: 14px;
    font-style: italic;
    animation: ${fadeIn} 0.3s ease-out;
`;

const Divider = styled.div`
    height: 1px;
    background: rgba(0, 0, 0, 0.1);
    margin: 20px 0;
    width: 100%;
    transform-origin: left;
    animation: ${scaleIn} 0.3s ease-out;
`;

export const InsightsDisplay: React.FC<InsightsDisplayProps> = ({ insights, questions }) => {
    if (!insights.length && !questions.length) {
        return (
            <InsightsContainer>
                <EmptyState>
                    Waiting for AI insights...
                </EmptyState>
            </InsightsContainer>
        );
    }

    return (
        <InsightsContainer>
            {insights.length > 0 && (
                <Section>
                    <Title>Key Insights</Title>
                    <List>
                        {insights.map((insight, index) => (
                            <ListItem key={index} index={index}>
                                {insight}
                            </ListItem>
                        ))}
                    </List>
                </Section>
            )}
            
            {insights.length > 0 && questions.length > 0 && <Divider />}
            
            {questions.length > 0 && (
                <Section>
                    <Title>Follow-up Questions</Title>
                    <List>
                        {questions.map((question, index) => (
                            <ListItem key={index} index={index}>
                                {question}
                            </ListItem>
                        ))}
                    </List>
                </Section>
            )}
        </InsightsContainer>
    );
};
