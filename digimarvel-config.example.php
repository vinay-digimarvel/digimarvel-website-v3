<?php
/*
 * Copy to digimarvel-config.php ONE LEVEL ABOVE public_html on Hostinger
 * (e.g. /home/<user>/domains/digimarvel.ai/digimarvel-config.php), so it can
 * never be served. api/contact.php reads it from there. Do not upload this
 * example or the real file into public_html, and never commit the real key.
 */
return [
    // Resend dashboard → API Keys → "Sending access", restricted to notify.digimarvel.ai.
    'resend_api_key' => 're_xxxxxxxxxxxxxxxxxxxxxxxx',
    // Must be an address on the domain verified in Resend. We send from the
    // notify. subdomain so the root domain's reputation (where support@ receives
    // mail) is kept separate from website traffic.
    'from' => 'DigiMarvel website <website@notify.digimarvel.ai>',
    'to' => 'support@digimarvel.ai',
    'allowed_origins' => ['https://www.digimarvel.ai', 'https://digimarvel.ai'],
];
