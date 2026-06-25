export interface MaskingDetector {
    mask(text: string): string;
}

class RegexDetector implements MaskingDetector {
    constructor(private regex: RegExp, private replacement: string) {}
    mask(text: string): string {
        return text.replace(this.regex, this.replacement);
    }
}

export class SensitiveInfoMasker {
    private detectors: MaskingDetector[] = [];

    constructor() {
        // AWS Key
        this.detectors.push(new RegexDetector(/(AKIA|A3T|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g, '[MASKED_AWS_KEY]'));
        
        // Github Token
        this.detectors.push(new RegexDetector(/gh[pousr]_[a-zA-Z0-9]{36}/g, '[MASKED_GITHUB_TOKEN]'));
        
        // OpenAI Key
        this.detectors.push(new RegexDetector(/sk-[a-zA-Z0-9]{48}/g, '[MASKED_OPENAI_KEY]'));
        
        // Anthropic Key
        this.detectors.push(new RegexDetector(/sk-ant-api03-[a-zA-Z0-9\-_]{93}AA/g, '[MASKED_ANTHROPIC_KEY]'));
        
        // Google API Key (AIza)
        this.detectors.push(new RegexDetector(/AIza[0-9A-Za-z\-_]{35}/g, '[MASKED_GOOGLE_KEY]'));
        
        // Bearer Token
        this.detectors.push(new RegexDetector(/Bearer\s+[A-Za-z0-9\-\._~+\/]+/g, 'Bearer [MASKED_TOKEN]'));
        
        // PEM / SSH Keys
        this.detectors.push(new RegexDetector(/-----BEGIN[A-Z\s]+PRIVATE KEY-----[a-zA-Z0-9\s/+=]+-----END[A-Z\s]+PRIVATE KEY-----/g, '[MASKED_PRIVATE_KEY]'));
        
        // JWT Token (heuristic: eyJ...)
        this.detectors.push(new RegexDetector(/eyJ[a-zA-Z0-9_=]+\.eyJ[a-zA-Z0-9_=]+\.?[a-zA-Z0-9_\-\+\/=]*/g, '[MASKED_JWT]'));
        
        // Entropy Detector (Any base64-like string longer than 40 chars that isn't already masked)
        // Note: Using a careful regex to avoid matching normal long words, focusing on mixed case with numbers/symbols
        this.detectors.push({
            mask: (text: string) => {
                // Find potential high entropy strings (alphanumeric with some symbols, length > 40)
                return text.replace(/\b[a-zA-Z0-9\-_+/=]{40,}\b/g, (match) => {
                    if (match.includes('MASKED_')) return match;
                    // Simple entropy check: must have mixed case and numbers
                    const hasLower = /[a-z]/.test(match);
                    const hasUpper = /[A-Z]/.test(match);
                    const hasNumber = /[0-9]/.test(match);
                    if (hasLower && hasUpper && hasNumber) {
                        return '[MASKED_HIGH_ENTROPY_STRING]';
                    }
                    return match;
                });
            }
        });
    }

    mask(text: string): string {
        if (!text) return text;
        let maskedText = text;
        for (const detector of this.detectors) {
            maskedText = detector.mask(maskedText);
        }
        return maskedText;
    }
}
