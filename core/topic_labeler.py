def generate_topic_label(keywords):
    if not keywords:
        return "General Discussion"

    if len(keywords) == 1:
        return keywords[0].title()

    # Clean formatting
    main = keywords[0].title()
    secondary = keywords[1].title()

    return f"{main} & {secondary}"