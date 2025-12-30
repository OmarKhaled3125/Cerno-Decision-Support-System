from rest_framework import serializers
from .models import Scenario
import json

class ScenarioSerializer(serializers.ModelSerializer):
    analysis_result = serializers.SerializerMethodField()

    class Meta:
        model = Scenario
        fields = ['id', 'input_text', 'analysis_result', 'created_at']
        read_only_fields = ['analysis_result', 'created_at']

    def get_analysis_result(self, obj):
        if obj.analysis_result:
            try:
                return json.loads(obj.analysis_result)
            except json.JSONDecodeError:
                return {}
        return None
