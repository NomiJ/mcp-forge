"""
End-to-end generation tests using src/test/storefront-sample.yaml.

Pipeline: load YAML → parse_spec → score_all → generate → ast.parse
"""

import ast
from pathlib import Path

import pytest

from app.modules import spec_parser, quality_scorer, code_generator

SAMPLE_PATH = Path(__file__).parent / "storefront-sample.yaml"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def spec_dict():
    content = SAMPLE_PATH.read_text()
    return spec_parser.load_spec(content, "yaml")


@pytest.fixture(scope="module")
def parsed(spec_dict):
    metadata, tool_cards = spec_parser.parse_spec(spec_dict)
    scored = quality_scorer.score_all(tool_cards)
    return metadata, scored


@pytest.fixture(scope="module")
def metadata(parsed):
    return parsed[0]


@pytest.fixture(scope="module")
def tool_cards(parsed):
    return parsed[1]


@pytest.fixture(scope="module")
def generated_source(metadata, tool_cards):
    return code_generator.generate(tool_cards, metadata)


# ---------------------------------------------------------------------------
# Metadata
# ---------------------------------------------------------------------------

class TestMetadata:
    def test_title(self, metadata):
        assert metadata.title == "E-commerce API"

    def test_version(self, metadata):
        assert metadata.version == "1.0.0"

    def test_base_url(self, metadata):
        assert metadata.base_url == "https://api.demo-ecommerce.com/v1"


# ---------------------------------------------------------------------------
# Tool card count and coverage
# ---------------------------------------------------------------------------

class TestToolCardCoverage:
    def test_total_count(self, tool_cards):
        # 11 operations in the spec
        assert len(tool_cards) == 11

    def test_all_methods_present(self, tool_cards):
        methods = {c.method for c in tool_cards}
        assert "GET" in methods
        assert "POST" in methods

    def test_all_paths_covered(self, tool_cards):
        paths = {c.path for c in tool_cards}
        expected_paths = {
            "/auth/register",
            "/auth/login",
            "/products",
            "/products/{id}",
            "/cart",
            "/cart/items",
            "/checkout",
            "/orders",
            "/orders/{orderId}",
            "/addresses",
        }
        assert paths == expected_paths


# ---------------------------------------------------------------------------
# Specific tool cards
# ---------------------------------------------------------------------------

def _card(tool_cards, method: str, path: str):
    matches = [c for c in tool_cards if c.method == method and c.path == path]
    assert matches, f"No card found for {method} {path}"
    return matches[0]


class TestToolCardDetails:
    def test_register_tool_name(self, tool_cards):
        card = _card(tool_cards, "POST", "/auth/register")
        assert card.tool_name == "post_auth_register"

    def test_login_tool_name(self, tool_cards):
        card = _card(tool_cards, "POST", "/auth/login")
        assert card.tool_name == "post_auth_login"

    def test_list_products_tool_name(self, tool_cards):
        card = _card(tool_cards, "GET", "/products")
        assert card.tool_name == "get_products"

    def test_get_product_by_id_tool_name(self, tool_cards):
        card = _card(tool_cards, "GET", "/products/{id}")
        assert card.tool_name == "get_products"

    def test_checkout_tool_name(self, tool_cards):
        card = _card(tool_cards, "POST", "/checkout")
        assert card.tool_name == "post_checkout"

    def test_register_has_request_body(self, tool_cards):
        card = _card(tool_cards, "POST", "/auth/register")
        assert card.request_body is not None
        assert card.request_body.required is True
        assert card.request_body.content_type == "application/json"

    def test_get_products_has_query_params(self, tool_cards):
        card = _card(tool_cards, "GET", "/products")
        param_names = {p.name for p in card.parameters}
        assert "category" in param_names
        assert "search" in param_names
        assert "min_price" in param_names
        assert "max_price" in param_names

    def test_get_products_query_params_are_not_required(self, tool_cards):
        card = _card(tool_cards, "GET", "/products")
        for p in card.parameters:
            assert p.required is False

    def test_get_product_by_id_has_path_param(self, tool_cards):
        card = _card(tool_cards, "GET", "/products/{id}")
        path_params = [p for p in card.parameters if p.location == "path"]
        assert len(path_params) == 1
        assert path_params[0].name == "id"
        assert path_params[0].required is True

    def test_get_order_by_id_has_path_param(self, tool_cards):
        card = _card(tool_cards, "GET", "/orders/{orderId}")
        path_params = [p for p in card.parameters if p.location == "path"]
        assert len(path_params) == 1
        assert path_params[0].name == "orderId"

    def test_descriptions_are_set(self, tool_cards):
        for card in tool_cards:
            assert card.description, f"Card {card.tool_name} ({card.method} {card.path}) has no description"


# ---------------------------------------------------------------------------
# Auth extraction
# ---------------------------------------------------------------------------

class TestAuth:
    def test_unauthenticated_endpoints_have_no_auth(self, tool_cards):
        # /auth/register and /auth/login have no security requirement
        for path in ("/auth/register", "/auth/login"):
            card = _card(tool_cards, "POST", path)
            assert card.auth is None, f"{path} should have no auth"

    def test_products_no_auth(self, tool_cards):
        card = _card(tool_cards, "GET", "/products")
        assert card.auth is None

    def test_cart_requires_bearer(self, tool_cards):
        card = _card(tool_cards, "GET", "/cart")
        assert card.auth is not None
        assert card.auth.type == "bearer"
        assert card.auth.location == "header"

    def test_checkout_requires_bearer(self, tool_cards):
        card = _card(tool_cards, "POST", "/checkout")
        assert card.auth is not None
        assert card.auth.type == "bearer"

    def test_orders_require_bearer(self, tool_cards):
        for method, path in [("GET", "/orders"), ("GET", "/orders/{orderId}")]:
            card = _card(tool_cards, method, path)
            assert card.auth is not None and card.auth.type == "bearer", \
                f"{method} {path} should require bearer auth"

    def test_addresses_require_bearer(self, tool_cards):
        for method, path in [("GET", "/addresses"), ("POST", "/addresses")]:
            card = _card(tool_cards, method, path)
            assert card.auth is not None and card.auth.type == "bearer"


# ---------------------------------------------------------------------------
# Quality scores
# ---------------------------------------------------------------------------

class TestQualityScores:
    def test_all_cards_have_a_score(self, tool_cards):
        for card in tool_cards:
            assert card.quality_score in ("green", "yellow", "red")

    def test_no_card_has_missing_score(self, tool_cards):
        for card in tool_cards:
            assert card.quality_score is not None

    def test_cards_with_short_descriptions_are_not_green(self, tool_cards):
        for card in tool_cards:
            word_count = len(card.description.split())
            if word_count < 5:
                assert card.quality_score == "red", \
                    f"{card.tool_name} has {word_count} words but score={card.quality_score}"

    def test_cards_with_descriptions_are_at_least_yellow(self, tool_cards):
        for card in tool_cards:
            # All storefront cards have summaries with ≥ 5 words
            word_count = len(card.description.split())
            if word_count >= 5:
                assert card.quality_score in ("yellow", "green"), \
                    f"{card.tool_name} has {word_count}-word description but score={card.quality_score}"


# ---------------------------------------------------------------------------
# LLM preview
# ---------------------------------------------------------------------------

class TestLlmPreview:
    def test_all_cards_have_llm_preview(self, tool_cards):
        for card in tool_cards:
            assert card.llm_preview, f"{card.tool_name} has empty llm_preview"

    def test_llm_preview_contains_tool_name(self, tool_cards):
        for card in tool_cards:
            assert card.tool_name in card.llm_preview

    def test_llm_preview_contains_path_param(self, tool_cards):
        card = _card(tool_cards, "GET", "/products/{id}")
        assert "id" in card.llm_preview

    def test_llm_preview_contains_body_marker_for_post(self, tool_cards):
        card = _card(tool_cards, "POST", "/auth/register")
        assert "body" in card.llm_preview


# ---------------------------------------------------------------------------
# Code generation
# ---------------------------------------------------------------------------

class TestCodeGeneration:
    def test_generates_without_error(self, generated_source):
        assert generated_source  # non-empty

    def test_output_is_valid_python(self, generated_source):
        # ast.parse raises SyntaxError if invalid; code_generator already does
        # this internally, but we assert explicitly so failures surface clearly
        tree = ast.parse(generated_source)
        assert tree is not None

    def test_contains_fastmcp_import(self, generated_source):
        assert "from fastmcp import FastMCP" in generated_source

    def test_contains_correct_base_url(self, generated_source):
        assert 'BASE_URL = "https://api.demo-ecommerce.com/v1"' in generated_source

    def test_contains_bearer_auth_setup(self, generated_source):
        assert "_API_TOKEN" in generated_source
        assert '"Authorization": "Bearer "' in generated_source or \
               '"Authorization": "Bearer " + _API_TOKEN' in generated_source

    def test_contains_mcp_tool_decorators(self, generated_source):
        assert "@mcp.tool()" in generated_source

    def test_tool_functions_present(self, generated_source):
        expected_functions = [
            "def post_auth_register",
            "def post_auth_login",
            "def get_products",
            "def get_cart",
            "def post_cart_items",
            "def post_checkout",
            "def get_orders",
            "def get_addresses",
            "def post_addresses",
        ]
        for fn in expected_functions:
            assert fn in generated_source, f"Missing function: {fn}"

    def test_path_param_in_url_format(self, generated_source):
        # /products/{id} and /orders/{orderId} must use .format()
        assert ".format(" in generated_source

    def test_main_guard_present(self, generated_source):
        assert 'if __name__ == "__main__":' in generated_source
        assert "mcp.run()" in generated_source

    def test_api_title_in_header_comment(self, generated_source):
        assert "E-commerce API" in generated_source

    def test_query_params_as_optional_args(self, generated_source):
        # GET /products has optional query params — they should default to None
        assert "category: str = None" in generated_source or \
               "category = None" in generated_source

    def test_disabled_cards_excluded(self, metadata, tool_cards):
        # Disable one card and re-generate; verify it's absent
        modified = [
            c.model_copy(update={"enabled": False}) if c.path == "/checkout" else c
            for c in tool_cards
        ]
        source = code_generator.generate(modified, metadata)
        assert "def post_checkout" not in source

    def test_generate_raises_if_all_disabled(self, metadata, tool_cards):
        disabled = [c.model_copy(update={"enabled": False}) for c in tool_cards]
        with pytest.raises(ValueError, match="No enabled tool cards"):
            code_generator.generate(disabled, metadata)
